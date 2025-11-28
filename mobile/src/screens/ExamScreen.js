import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, AppState } from 'react-native';
import { Text, Button, RadioButton, IconButton, Card, Portal, Modal, Chip } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { candidateAPI } from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ExamScreen({ route, navigation }) {
  const { exam } = route.params;
  const insets = useSafeAreaInsets();
  
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [timeRemaining, setTimeRemaining] = useState(exam.duration * 60); // in seconds
  const [loading, setLoading] = useState(true);
  const [paletteVisible, setPaletteVisible] = useState(false);
  const [violations, setViolations] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const appState = useRef(AppState.currentState);
  const timerRef = useRef(null);
  const autoSaveRef = useRef(null);

  useEffect(() => {
    startExam();
    startTimer();
    startAutoSave();
    
    if (exam.enforce_screen_lock) {
      const subscription = AppState.addEventListener('change', handleAppStateChange);
      return () => {
        subscription?.remove();
        clearInterval(timerRef.current);
        clearInterval(autoSaveRef.current);
      };
    }

    return () => {
      clearInterval(timerRef.current);
      clearInterval(autoSaveRef.current);
    };
  }, []);

  const startExam = async () => {
    try {
      const data = await candidateAPI.startExam(exam.id);
      setQuestions(data.questions);
      
      // Load saved progress if any
      const savedProgress = await AsyncStorage.getItem(`exam_${exam.id}_progress`);
      if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        setAnswers(progress.answers || {});
        setFlagged(new Set(progress.flagged || []));
        setCurrentQuestionIndex(progress.currentQuestionIndex || 0);
      }
    } catch (error) {
      let errorMessage = 'Failed to start exam. Please try again.';
      
      if (error.response?.status === 403) {
        errorMessage = error.response?.data?.error || 'You are not authorized to access this exam.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.error || 'Invalid exam request.';
      }
      
      Alert.alert('Error', errorMessage);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeRemaining((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current);
          clearInterval(autoSaveRef.current);
          setTimeout(() => {
            submitExam('Time expired - exam duration completed');
          }, 100);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  const startAutoSave = () => {
    autoSaveRef.current = setInterval(() => {
      saveProgress();
    }, 30000); // Auto-save every 30 seconds
  };

  const saveProgress = async () => {
    try {
      const progress = {
        answers,
        flagged: Array.from(flagged),
        currentQuestionIndex,
      };
      await AsyncStorage.setItem(`exam_${exam.id}_progress`, JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const handleAppStateChange = (nextAppState) => {
    if (appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
      // App was minimized
      const violation = {
        type: 'App Minimized',
        timestamp: new Date().toISOString(),
        description: 'Candidate minimized the app during the exam',
      };
      
      setViolations((prevViolations) => {
        const newViolations = [...prevViolations, violation];
        
        if (newViolations.length >= 3) {
          // Auto-submit with updated violations list
          setTimeout(() => {
            handleAutoSubmitWithViolations(newViolations, 'Too many violations (3 or more screen lock violations)');
          }, 100);
        } else {
          Alert.alert(
            'Warning',
            `You minimized the app. This violation has been logged. (${newViolations.length}/3)`,
            [{ text: 'OK' }]
          );
        }
        
        return newViolations;
      });
    }
    appState.current = nextAppState;
  };

  const handleAnswerSelect = async (answer) => {
    const newAnswers = {
      ...answers,
      [questions[currentQuestionIndex].id]: answer,
    };
    setAnswers(newAnswers);
    
    // Save answer to backend
    try {
      await candidateAPI.saveAnswer(
        exam.id,
        questions[currentQuestionIndex].id,
        answer
      );
    } catch (error) {
      console.error('Error saving answer:', error);
      
      if (error.response?.status === 403) {
        Alert.alert(
          'Access Denied',
          'You are not authorized to take this exam. The exam will now close.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    }
  };

  const toggleFlag = () => {
    const questionId = questions[currentQuestionIndex].id;
    const newFlagged = new Set(flagged);
    
    if (newFlagged.has(questionId)) {
      newFlagged.delete(questionId);
    } else {
      newFlagged.add(questionId);
    }
    
    setFlagged(newFlagged);
  };

  const navigateQuestion = (direction) => {
    if (direction === 'next' && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    const unanswered = questions.length - Object.keys(answers).length;
    
    Alert.alert(
      'Submit Exam?',
      `You have answered ${Object.keys(answers).length} out of ${questions.length} questions.\n\n${
        unanswered > 0 ? `${unanswered} questions are unanswered.\n\n` : ''
      }Are you sure you want to submit?`,
      [
        { text: 'Go Back', style: 'cancel' },
        { text: 'Submit', onPress: submitExam, style: 'destructive' },
      ]
    );
  };

  const handleAutoSubmit = async (reason) => {
    clearInterval(timerRef.current);
    clearInterval(autoSaveRef.current);
    await submitExam(reason);
  };

  const handleAutoSubmitWithViolations = async (violationsList, reason) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    clearInterval(timerRef.current);
    clearInterval(autoSaveRef.current);

    try {
      const formattedAnswers = questions.map((q) => ({
        question_id: q.id,
        answer: answers[q.id] || null,
      }));

      await candidateAPI.submitExam(exam.id, formattedAnswers, violationsList);
      await AsyncStorage.removeItem(`exam_${exam.id}_progress`);
      
      Alert.alert(
        'Exam Auto-Submitted',
        reason,
        [{ 
          text: 'OK', 
          onPress: () => {
            if (exam.show_results) {
              navigation.replace('Result', { examId: exam.id });
            } else {
              navigation.navigate('Dashboard');
            }
          }
        }],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Auto-submit error:', error);
      Alert.alert(
        'Exam Auto-Submitted',
        'Your exam has been auto-submitted due to violations. You will be redirected to the dashboard.',
        [{ text: 'OK', onPress: () => navigation.navigate('Dashboard') }],
        { cancelable: false }
      );
    }
  };

  const submitExam = async (autoSubmitReason = null) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    clearInterval(timerRef.current);
    clearInterval(autoSaveRef.current);

    try {
      const formattedAnswers = questions.map((q) => ({
        question_id: q.id,
        answer: answers[q.id] || null,
      }));

      await candidateAPI.submitExam(exam.id, formattedAnswers, violations);
      await AsyncStorage.removeItem(`exam_${exam.id}_progress`);
      
      if (autoSubmitReason) {
        Alert.alert(
          'Exam Auto-Submitted',
          autoSubmitReason,
          [{ 
            text: 'OK', 
            onPress: () => {
              if (exam.show_results) {
                navigation.replace('Result', { examId: exam.id });
              } else {
                navigation.navigate('Dashboard');
              }
            }
          }],
          { cancelable: false }
        );
      } else if (exam.show_results) {
        navigation.replace('Result', { examId: exam.id });
      } else {
        Alert.alert(
          'Exam Submitted',
          'Your exam has been submitted successfully. Results will be shared by your teacher.',
          [{ text: 'OK', onPress: () => navigation.navigate('Dashboard') }]
        );
      }
    } catch (error) {
      let errorMessage = 'Failed to submit exam. Please try again.';
      
      if (error.response?.status === 403) {
        errorMessage = error.response?.data?.error || 'You are not authorized to submit this exam.';
        Alert.alert('Access Denied', errorMessage, [
          { text: 'OK', onPress: () => navigation.navigate('Dashboard') }
        ]);
        return;
      }
      
      Alert.alert('Error', errorMessage);
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (questionId) => {
    if (answers[questionId]) return 'answered';
    if (flagged.has(questionId)) return 'flagged';
    return 'unanswered';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading exam...</Text>
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[
        styles.header, 
        timeRemaining < 300 && styles.headerWarning,
        { paddingTop: Math.max(insets.top, 16) + 16 }
      ]}>
        <View style={styles.headerLeft}>
          <Text variant="titleMedium" style={styles.timerText}>
            {formatTime(timeRemaining)}
          </Text>
          {violations.length > 0 && (
            <Chip
              icon="alert"
              style={[
                styles.violationChip,
                violations.length >= 2 && styles.violationChipCritical
              ]}
              textStyle={{ 
                fontSize: 12, 
                fontWeight: 'bold',
                color: violations.length >= 2 ? '#fff' : '#991b1b'
              }}
            >
              {violations.length}/3 violations
            </Chip>
          )}
        </View>
        <Text variant="bodyMedium" style={styles.questionCounter}>
          Question {currentQuestionIndex + 1} / {questions.length}
        </Text>
      </View>

      {/* Question Content */}
      <ScrollView style={styles.content}>
        <Card style={styles.questionCard}>
          <Card.Content>
            <View style={styles.questionHeader}>
              <Text variant="titleMedium" style={styles.questionNumber}>
                Question {currentQuestionIndex + 1}
              </Text>
              <IconButton
                icon={flagged.has(currentQuestion.id) ? 'flag' : 'flag-outline'}
                iconColor={flagged.has(currentQuestion.id) ? '#ef4444' : '#64748b'}
                onPress={toggleFlag}
              />
            </View>
            
            <Text variant="bodyLarge" style={styles.questionText}>
              {currentQuestion.question_text}
            </Text>

            <RadioButton.Group
              onValueChange={handleAnswerSelect}
              value={answers[currentQuestion.id] || ''}
            >
              {['A', 'B', 'C', 'D'].map((option) => {
                const optionKey = `option_${option.toLowerCase()}`;
                if (!currentQuestion[optionKey]) return null;
                
                return (
                  <View key={option} style={styles.optionContainer}>
                    <RadioButton.Item
                      label={currentQuestion[optionKey]}
                      value={option}
                      style={styles.radioItem}
                      labelStyle={styles.radioLabel}
                    />
                  </View>
                );
              })}
            </RadioButton.Group>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Navigation Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.navigationButtons}>
          <Button
            mode="outlined"
            onPress={() => navigateQuestion('prev')}
            disabled={currentQuestionIndex === 0}
            style={styles.navButton}
          >
            Previous
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => setPaletteVisible(true)}
            style={styles.paletteButton}
            icon="grid"
          >
            Palette
          </Button>
          
          {!isLastQuestion ? (
            <Button
              mode="outlined"
              onPress={() => navigateQuestion('next')}
              style={styles.navButton}
            >
              Next
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.submitButton}
              disabled={isSubmitting}
            >
              Submit
            </Button>
          )}
        </View>
      </View>

      {/* Question Palette Modal */}
      <Portal>
        <Modal
          visible={paletteVisible}
          onDismiss={() => setPaletteVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text variant="titleMedium" style={styles.modalTitle}>
            Question Palette
          </Text>
          
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.answeredBox]} />
              <Text style={styles.legendText}>Answered</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.flaggedBox]} />
              <Text style={styles.legendText}>Flagged</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.unansweredBox]} />
              <Text style={styles.legendText}>Unanswered</Text>
            </View>
          </View>

          <ScrollView style={styles.paletteScroll}>
            <View style={styles.paletteGrid}>
              {questions.map((q, index) => {
                const status = getQuestionStatus(q.id);
                return (
                  <Button
                    key={q.id}
                    mode={index === currentQuestionIndex ? 'contained' : 'outlined'}
                    onPress={() => {
                      setCurrentQuestionIndex(index);
                      setPaletteVisible(false);
                    }}
                    style={[
                      styles.paletteButton,
                      status === 'answered' && styles.paletteAnswered,
                      status === 'flagged' && styles.paletteFlagged,
                    ]}
                    compact
                  >
                    {index + 1}
                  </Button>
                );
              })}
            </View>
          </ScrollView>

          <Button
            mode="contained"
            onPress={() => setPaletteVisible(false)}
            style={styles.closePaletteButton}
          >
            Close
          </Button>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerWarning: {
    backgroundColor: '#fef3c7',
    borderBottomColor: '#f59e0b',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerText: {
    fontWeight: 'bold',
    color: '#1e293b',
    fontSize: 20,
  },
  violationChip: {
    backgroundColor: '#fee2e2',
  },
  violationChipCritical: {
    backgroundColor: '#dc2626',
  },
  questionCounter: {
    color: '#64748b',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  questionCard: {
    elevation: 2,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionNumber: {
    fontWeight: 'bold',
    color: '#d97706',
  },
  questionText: {
    color: '#1e293b',
    marginBottom: 24,
    lineHeight: 26,
  },
  optionContainer: {
    marginBottom: 8,
  },
  radioItem: {
    paddingHorizontal: 0,
  },
  radioLabel: {
    fontSize: 16,
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    flex: 1,
  },
  paletteButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  answeredBox: {
    backgroundColor: '#10b981',
  },
  flaggedBox: {
    backgroundColor: '#f59e0b',
  },
  unansweredBox: {
    backgroundColor: '#e2e8f0',
  },
  legendText: {
    fontSize: 12,
    color: '#64748b',
  },
  paletteScroll: {
    maxHeight: 400,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paletteButton: {
    width: 50,
  },
  paletteAnswered: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
  },
  paletteFlagged: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  closePaletteButton: {
    marginTop: 16,
  },
});

