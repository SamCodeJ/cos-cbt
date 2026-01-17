import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, AppState, Image } from 'react-native';
import { Text, Button, RadioButton, IconButton, Card, Portal, Modal, Chip, Checkbox } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { candidateAPI, API_BASE_URL } from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RenderHTML from 'react-native-render-html';
import KioskMode from '../utils/KioskMode';
import { useAuthStore } from '../store/authStore';

export default function ExamScreen({ route, navigation }) {
  const { exam } = route.params;
  const insets = useSafeAreaInsets();
  const { logout } = useAuthStore();
  
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
  const timeCheckRef = useRef(null);

  useEffect(() => {
    initializeExam();
    
    if (exam.enforce_screen_lock) {
      const subscription = AppState.addEventListener('change', handleAppStateChange);
      return () => {
        subscription?.remove();
        clearInterval(timerRef.current);
        clearInterval(autoSaveRef.current);
        clearInterval(timeCheckRef.current);
        // Deactivate kiosk mode on cleanup
        KioskMode.deactivate().catch(err => console.error('Cleanup kiosk error:', err));
      };
    }

    return () => {
      clearInterval(timerRef.current);
      clearInterval(autoSaveRef.current);
      clearInterval(timeCheckRef.current);
      // Deactivate kiosk mode on cleanup
      KioskMode.deactivate().catch(err => console.error('Cleanup kiosk error:', err));
    };
  }, []);

  const initializeExam = async () => {
    // Activate kiosk mode FIRST
    try {
      await KioskMode.activate();
    } catch (error) {
      console.error('Failed to activate kiosk mode:', error);
      // Continue with exam even if kiosk mode fails
    }

    // Then start the exam
    startExam();
    startTimer();
    startAutoSave();
    startTimeCheck(); // Check for time extensions periodically
  };

  // Helper function to convert [IMAGE:...] placeholders to <img> tags with full URLs
  const convertImagePlaceholders = (html) => {
    if (!html) return html;
    // Convert [IMAGE:/uploads/question-images/filename.jpg] to <img> tag
    return html.replace(/\[IMAGE:([^\]]+)\]/gi, (match, imagePath) => {
      // Remove leading slash if present and construct full URL
      const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
      const baseUrl = API_BASE_URL.replace('/api', '');
      const imageUrl = `${baseUrl}/${cleanPath}`;
      return `<img src="${imageUrl}" style="max-width: 100%; height: auto;" />`;
    });
  };

  const startExam = async () => {
    try {
      const data = await candidateAPI.startExam(exam.id);
      
      // Set the correct initial time from server response
      if (data.time_remaining_seconds !== undefined) {
        console.log(`⏱️ Initial time from server: ${data.time_remaining_seconds} seconds (${Math.floor(data.time_remaining_seconds / 60)} minutes)`);
        setTimeRemaining(data.time_remaining_seconds);
      } else {
        console.log('⚠️ No time_remaining_seconds in response, using exam duration');
      }
      
      // Debug: Log first question to check option formatting
      if (data.questions && data.questions.length > 0) {
        console.log('Sample question options:', {
          option_a: data.questions[0].option_a,
          option_b: data.questions[0].option_b,
          option_c: data.questions[0].option_c,
          option_d: data.questions[0].option_d
        });
      }
      // Convert image placeholders to HTML img tags
      const questionsWithImages = data.questions.map(q => ({
        ...q,
        question_text: convertImagePlaceholders(q.question_text),
        option_a: convertImagePlaceholders(q.option_a),
        option_b: convertImagePlaceholders(q.option_b),
        option_c: convertImagePlaceholders(q.option_c),
        option_d: convertImagePlaceholders(q.option_d),
        passage: convertImagePlaceholders(q.passage),
        instruction: convertImagePlaceholders(q.instruction)
      }));
      setQuestions(questionsWithImages);
      
      // Load saved progress if any
      const savedProgress = await AsyncStorage.getItem(`exam_${exam.id}_progress`);
      if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        setAnswers(progress.answers || {});
        setFlagged(new Set(progress.flagged || []));
        setCurrentQuestionIndex(progress.currentQuestionIndex || 0);
      }
    } catch (error) {
      console.error('Start exam error:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Failed to start exam. Please try again.';
      let errorDetails = '';
      
      if (error.response?.status === 403) {
        errorMessage = error.response?.data?.error || 'You are not authorized to access this exam.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.error || 'Invalid exam request.';
      } else if (error.response?.status === 500) {
        errorMessage = error.response?.data?.error || 'Server error occurred.';
        // Show detailed error in development
        if (error.response?.data?.details) {
          errorDetails = `\n\nDetails: ${error.response.data.details.message || error.response.data.details}`;
          if (error.response.data.details.detail) {
            errorDetails += `\n${error.response.data.details.detail}`;
          }
        }
      }
      
      Alert.alert('Error', errorMessage + errorDetails);
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
          clearInterval(timeCheckRef.current);
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
    }, 45000); // Auto-save every 45 seconds (optimized for 1000 concurrent users)
  };

  // Check for time extensions from teacher
  const startTimeCheck = () => {
    timeCheckRef.current = setInterval(() => {
      checkTimeRemaining();
    }, 60000); // Check every 60 seconds (optimized for 1000 concurrent users)
  };

  const checkTimeRemaining = async () => {
    try {
      console.log('🔄 Checking time remaining from server...');
      const response = await candidateAPI.getTimeRemaining(exam.id);
      console.log('📊 Server response:', JSON.stringify(response));
      
      if (response && response.time_remaining_seconds !== undefined && response.time_remaining_seconds !== null) {
        const serverTimeRemaining = parseInt(response.time_remaining_seconds);
        
        // Validate server time is positive
        if (serverTimeRemaining < 0) {
          console.log('⚠️ Server returned negative time, ignoring:', serverTimeRemaining);
          return;
        }
        
        // If server time is significantly different (more than 5 seconds), update it
        // This handles time extensions from teacher
        setTimeRemaining((currentTime) => {
          const difference = Math.abs(serverTimeRemaining - currentTime);
          
          console.log(`⏱️ Time comparison - Current: ${currentTime}s, Server: ${serverTimeRemaining}s, Difference: ${difference}s`);
          
          if (difference > 5) {
            // Show notification if time was extended
            if (serverTimeRemaining > currentTime) {
              const addedMinutes = Math.floor((serverTimeRemaining - currentTime) / 60);
              console.log(`✅ Time extended! Adding ${addedMinutes} minute(s)`);
              if (addedMinutes > 0) {
                Alert.alert(
                  '⏰ Time Extended',
                  `Your teacher has added ${addedMinutes} minute(s) to your exam time!`,
                  [{ text: 'OK' }]
                );
              }
            } else {
              console.log('⚠️ Server time is LESS than current time - possible time reduction or calculation error');
            }
            console.log(`🔄 Updating timer from ${currentTime}s to ${serverTimeRemaining}s`);
            return serverTimeRemaining;
          } else {
            console.log('✅ Time difference within threshold, keeping current timer');
          }
          
          return currentTime;
        });
      } else {
        console.log('⚠️ Invalid or missing time_remaining_seconds in response:', response);
      }
    } catch (error) {
      // Log error but don't disrupt the exam
      console.error('❌ Time check error:', error.message);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
    }
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

  // Handle multi-answer checkbox toggle
  const handleCheckboxToggle = async (option) => {
    const questionId = questions[currentQuestionIndex].id;
    const currentAnswer = answers[questionId] || '';
    const selectedOptions = currentAnswer ? currentAnswer.split(',') : [];
    
    let newSelectedOptions;
    if (selectedOptions.includes(option)) {
      // Remove the option
      newSelectedOptions = selectedOptions.filter(o => o !== option);
    } else {
      // Add the option
      newSelectedOptions = [...selectedOptions, option];
    }
    
    // Sort and join
    const newAnswer = newSelectedOptions.sort().join(',');
    
    const newAnswers = {
      ...answers,
      [questionId]: newAnswer,
    };
    setAnswers(newAnswers);
    
    // Save answer to backend
    try {
      await candidateAPI.saveAnswer(
        exam.id,
        questionId,
        newAnswer
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

  // Check if an option is selected in multi-answer question
  const isCheckboxChecked = (option) => {
    const currentAnswer = answers[currentQuestion.id] || '';
    const selectedOptions = currentAnswer.split(',');
    return selectedOptions.includes(option);
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
      
      // Deactivate kiosk mode before showing alert
      await KioskMode.deactivate();
      
      Alert.alert(
        'Exam Auto-Submitted',
        reason,
        [{ 
          text: 'OK', 
          onPress: async () => {
            if (exam.show_results) {
              // Don't logout yet - ResultScreen needs the token to fetch results
              navigation.replace('Result', { examId: exam.id });
            } else {
              // Logout before showing thank you screen (no API call needed)
              await AsyncStorage.removeItem('auth_token');
              await AsyncStorage.removeItem('candidate');
              logout();
              navigation.replace('ThankYou', { examTitle: exam.title });
            }
          }
        }],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Auto-submit error:', error);
      // Deactivate kiosk mode even on error
      await KioskMode.deactivate();
      
      // Logout and show thank you screen on error
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('candidate');
      logout();
      
      Alert.alert(
        'Exam Auto-Submitted',
        'Your exam has been auto-submitted due to violations.',
        [{ text: 'OK', onPress: () => navigation.replace('ThankYou', { examTitle: exam.title }) }],
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
      
      // Deactivate kiosk mode after successful submission
      await KioskMode.deactivate();
      
      if (autoSubmitReason) {
        Alert.alert(
          'Exam Auto-Submitted',
          autoSubmitReason,
          [{ 
            text: 'OK', 
            onPress: async () => {
              if (exam.show_results) {
                // Don't logout yet - ResultScreen needs the token to fetch results
                navigation.replace('Result', { examId: exam.id });
              } else {
                // Logout before showing thank you screen (no API call needed)
                await AsyncStorage.removeItem('auth_token');
                await AsyncStorage.removeItem('candidate');
                logout();
                navigation.replace('ThankYou', { examTitle: exam.title });
              }
            }
          }],
          { cancelable: false }
        );
      } else if (exam.show_results) {
        // Don't logout yet - ResultScreen needs the token to fetch results
        navigation.replace('Result', { examId: exam.id });
      } else {
        // Logout before showing thank you screen (no API call needed)
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('candidate');
        logout();
        navigation.replace('ThankYou', { examTitle: exam.title });
      }
    } catch (error) {
      let errorMessage = 'Failed to submit exam. Please try again.';
      
      if (error.response?.status === 403) {
        errorMessage = error.response?.data?.error || 'You are not authorized to submit this exam.';
        // Deactivate kiosk mode on error too
        await KioskMode.deactivate();
        
        // Logout on error too
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('candidate');
        logout();
        
        Alert.alert('Access Denied', errorMessage, [
          { text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }) }
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

  // Safety check - ensure we have a valid question
  if (!currentQuestion) {
    return (
      <View style={styles.centerContainer}>
        <Text>Error: Question not found</Text>
        <Button onPress={() => navigation.goBack()}>Go Back</Button>
      </View>
    );
  }

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
            {/* Section Header - Show if this question has a section */}
            {currentQuestion?.section_id && (
              <View style={styles.sectionHeader}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  📚 Section: {currentQuestion.section_id}
                </Text>
                {currentQuestion?.instruction && (
                  <View style={styles.sectionInstruction}>
                    <Text style={styles.instructionLabel}>Instructions: </Text>
                    <RenderHTML
                      contentWidth={300}
                      source={{ html: currentQuestion.instruction }}
                      baseStyle={styles.instructionText}
                      tagsStyles={{
                        sub: { fontSize: 10, lineHeight: 14 },
                        sup: { fontSize: 10, lineHeight: 14 },
                        img: { maxWidth: '100%', height: 'auto' }
                      }}
                      renderersProps={{
                        img: {
                          enableExperimentalPercentWidth: true
                        }
                      }}
                    />
                  </View>
                )}
              </View>
            )}
            
            {/* Passage - Show if this question has a passage */}
            {currentQuestion?.passage && (
              <View style={styles.passageContainer}>
            <RenderHTML
              contentWidth={300}
              source={{ html: currentQuestion.passage }}
              baseStyle={styles.passageText}
              tagsStyles={{
                sub: { fontSize: 10, lineHeight: 14 },
                sup: { fontSize: 10, lineHeight: 14 },
                strong: { fontWeight: 'bold' },
                b: { fontWeight: 'bold' },
                em: { fontStyle: 'italic' },
                i: { fontStyle: 'italic' },
                u: { textDecorationLine: 'underline' },
                img: { maxWidth: '100%', height: 'auto' }
              }}
              renderersProps={{
                img: {
                  enableExperimentalPercentWidth: true
                }
              }}
            />
              </View>
            )}
            
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
            
            <RenderHTML
              contentWidth={300}
              source={{ html: currentQuestion.question_text }}
              baseStyle={styles.questionText}
              tagsStyles={{
                sub: { fontSize: 10, lineHeight: 14 },
                sup: { fontSize: 10, lineHeight: 14 },
                strong: { fontWeight: 'bold' },
                b: { fontWeight: 'bold' },
                em: { fontStyle: 'italic' },
                i: { fontStyle: 'italic' },
                u: { textDecorationLine: 'underline' },
                img: { maxWidth: '100%', height: 'auto' }
              }}
              renderersProps={{
                img: {
                  enableExperimentalPercentWidth: true
                }
              }}
            />

            {currentQuestion.is_multi_answer ? (
              <View>
                <Text variant="labelSmall" style={styles.multiAnswerHint}>
                  Select all correct answers
                </Text>
                {['A', 'B', 'C', 'D'].map((option) => {
                  const optionKey = `option_${option.toLowerCase()}`;
                  // Check if option exists and has content (not just empty string or whitespace)
                  if (!currentQuestion[optionKey] || !String(currentQuestion[optionKey]).trim()) return null;
                  
                  return (
                    <View key={option} style={styles.optionContainer}>
                      <View style={styles.optionRow}>
                        <Checkbox
                          status={isCheckboxChecked(option) ? 'checked' : 'unchecked'}
                          onPress={() => handleCheckboxToggle(option)}
                          uncheckedColor="#64748b"
                          color="#d97706"
                        />
                        <View style={styles.optionLabelContainer}>
                          <Text style={styles.optionLetter}>{option}: </Text>
                          {currentQuestion[optionKey] && String(currentQuestion[optionKey]).trim() ? (
                            <View style={{ flex: 1 }}>
                              <RenderHTML
                                contentWidth={250}
                                source={{ html: String(currentQuestion[optionKey]).trim() }}
                                baseStyle={styles.optionLabel}
                                tagsStyles={{
                                  sub: { fontSize: 10, lineHeight: 14 },
                                  sup: { fontSize: 10, lineHeight: 14 },
                                  strong: { fontWeight: 'bold' },
                                  b: { fontWeight: 'bold' },
                                  em: { fontStyle: 'italic' },
                                  i: { fontStyle: 'italic' },
                                  u: { textDecorationLine: 'underline' },
                                  img: { maxWidth: '100%', height: 'auto' }
                                }}
                                defaultTextProps={{ numberOfLines: 0 }}
                                renderersProps={{
                                  text: { allowFontScaling: true },
                                  img: {
                                    enableExperimentalPercentWidth: true
                                  }
                                }}
                                systemFonts={['System']}
                              />
                            </View>
                          ) : (
                            <Text style={styles.optionLabel}>No option text</Text>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <RadioButton.Group
                onValueChange={handleAnswerSelect}
                value={answers[currentQuestion.id] || ''}
              >
                {['A', 'B', 'C', 'D'].map((option) => {
                  const optionKey = `option_${option.toLowerCase()}`;
                  // Check if option exists and has content (not just empty string or whitespace)
                  if (!currentQuestion[optionKey] || !String(currentQuestion[optionKey]).trim()) return null;
                  
                  return (
                    <View key={option} style={styles.optionContainer}>
                      <View style={styles.optionRow}>
                        <RadioButton
                          value={option}
                          status={answers[currentQuestion.id] === option ? 'checked' : 'unchecked'}
                          onPress={() => handleAnswerSelect(option)}
                          uncheckedColor="#64748b"
                          color="#d97706"
                        />
                        <View style={styles.optionLabelContainer} onStartShouldSetResponder={() => true} onResponderRelease={() => handleAnswerSelect(option)}>
                          <Text style={styles.optionLetter}>{option}: </Text>
                          {currentQuestion[optionKey] && currentQuestion[optionKey].trim() ? (
                            <View style={{ flex: 1 }}>
                              <RenderHTML
                                contentWidth={250}
                                source={{ html: String(currentQuestion[optionKey]).trim() }}
                                baseStyle={styles.optionLabel}
                                tagsStyles={{
                                  sub: { fontSize: 10, lineHeight: 14 },
                                  sup: { fontSize: 10, lineHeight: 14 },
                                  strong: { fontWeight: 'bold' },
                                  b: { fontWeight: 'bold' },
                                  em: { fontStyle: 'italic' },
                                  i: { fontStyle: 'italic' },
                                  u: { textDecorationLine: 'underline' },
                                  img: { maxWidth: '100%', height: 'auto' }
                                }}
                                defaultTextProps={{ numberOfLines: 0 }}
                                renderersProps={{
                                  text: { allowFontScaling: true },
                                  img: {
                                    enableExperimentalPercentWidth: true
                                  }
                                }}
                                systemFonts={['System']}
                              />
                            </View>
                          ) : (
                            <Text style={styles.optionLabel}>No option text</Text>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </RadioButton.Group>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Navigation Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.navigationButtons}>
          <View style={styles.buttonWrapperLeft}>
            <Button
              mode="outlined"
              onPress={() => navigateQuestion('prev')}
              disabled={currentQuestionIndex === 0}
              style={styles.navButton}
              contentStyle={styles.buttonContent}
            >
              Previous
            </Button>
          </View>
          
          <View style={styles.buttonWrapperCenter}>
            <Button
              mode="outlined"
              onPress={() => setPaletteVisible(true)}
              style={styles.paletteButton}
              contentStyle={styles.buttonContent}
              icon="grid"
            >
              P.
            </Button>
          </View>
          
          <View style={styles.buttonWrapperRight}>
            {!isLastQuestion ? (
              <Button
                mode="outlined"
                onPress={() => navigateQuestion('next')}
                style={styles.navButton}
                contentStyle={styles.buttonContent}
              >
                Next
              </Button>
            ) : (
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.submitButton}
                contentStyle={styles.buttonContent}
                disabled={isSubmitting}
              >
                Submit
              </Button>
            )}
          </View>
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
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  optionLabelContainer: {
    flex: 1,
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  optionLetter: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginRight: 4,
  },
  optionLabel: {
    fontSize: 16,
    color: '#1e293b',
    flex: 1,
  },
  radioItem: {
    paddingHorizontal: 0,
  },
  radioLabel: {
    fontSize: 16,
  },
  checkboxItem: {
    paddingHorizontal: 0,
  },
  checkboxLabel: {
    fontSize: 16,
  },
  multiAnswerHint: {
    color: '#d97706',
    marginBottom: 12,
    fontWeight: 'bold',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  buttonWrapperLeft: {
    width: '40%',
    marginRight: 2,
    height: 60,
  },
  buttonWrapperCenter: {
    width: '20%',
    marginHorizontal:1.5,
    height: 60,
  },
  buttonWrapperRight: {
    width: '40%',
    height: 60,
    marginLeft: 2,
  },
  navButton: {
    width: '100%',
  },
  paletteButton: {
    width: '100%',
  },
  submitButton: {
    width: '100%',
  },
  buttonContent: {
    paddingVertical: 8,
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
  sectionHeader: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
  },
  sectionInstruction: {
    color: '#78350f',
    lineHeight: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  instructionLabel: {
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 14,
    color: '#78350f',
    lineHeight: 20,
  },
  passageContainer: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  passageText: {
    color: '#0c4a6e',
    lineHeight: 22,
    fontStyle: 'italic',
  },
});

