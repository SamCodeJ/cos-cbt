import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, List, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { candidateAPI } from '../api/client';
import RenderHTML from 'react-native-render-html';
import { useAuthStore } from '../store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ResultScreen({ route, navigation }) {
  const { examId } = route.params;
  const insets = useSafeAreaInsets();
  const { logout } = useAuthStore();
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadResult();
  }, []);

  const loadResult = async () => {
    try {
      const data = await candidateAPI.getResult(examId);
      
      // Debug logging
      console.log('📊 Result data received:', {
        score_percentage: data.score_percentage,
        pass_mark: data.pass_mark,
        score_type: typeof data.score_percentage,
        pass_mark_type: typeof data.pass_mark,
        passed: data.passed
      });
      
      setResult(data);
    } catch (error) {
      console.error('Error loading result:', error);
      
      let errorMessage = 'Failed to load results. Please try again.';
      
      if (error.response?.status === 403) {
        errorMessage = error.response?.data?.error || 'You are not authorized to view these results.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Results not found or not yet available.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToLogin = async () => {
  try {
    // Clear auth data
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('candidate');
    
    // Call logout from store
    logout();
    
    // Navigate to login
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  } catch (error) {
    console.error('Error during logout:', error);
    // Navigate anyway
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  }
};

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading results...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Unable to Load Results</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Button mode="contained" onPress={() => navigation.navigate('Dashboard')} style={{ marginTop: 16 }}>
          Back to Dashboard
        </Button>
      </View>
    );
  }

  if (!result) {
    return (
      <View style={styles.centerContainer}>
        <Text>Results not available</Text>
        <Button mode="contained" onPress={() => navigation.navigate('Dashboard')} style={{ marginTop: 16 }}>
          Back to Dashboard
        </Button>
      </View>
    );
  }

  // Ensure numerical comparison by converting both to numbers
  const scorePercentage = Number(result.score_percentage);
  const passMark = Number(result.pass_mark);
  const passed = scorePercentage >= passMark;
  
  console.log('🔍 Pass/Fail Check:', {
    scorePercentage,
    passMark,
    passed,
    comparison: `${scorePercentage} >= ${passMark}`
  });

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 16 }]}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Exam Results
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Result Status Card */}
        <Card style={[styles.card, passed ? styles.passedCard : styles.failedCard]}>
          <Card.Content style={styles.resultContent}>
            <Text variant="displaySmall" style={styles.resultIcon}>
              {passed ? '🎉' : '😔'}
            </Text>
            <Text variant="headlineMedium" style={styles.resultStatus}>
              {passed ? 'Congratulations!' : 'Keep Trying!'}
            </Text>
            <Text variant="bodyLarge" style={styles.resultMessage}>
              {passed
                ? 'You have passed the examination!'
                : 'You did not meet the pass mark this time.'}
            </Text>
          </Card.Content>
        </Card>

        {/* Score Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Your Score
            </Text>
            <View style={styles.scoreContainer}>
              <Text variant="displayLarge" style={styles.scoreText}>
                {result.score_percentage}%
              </Text>
              <Text variant="bodyMedium" style={styles.scoreDetails}>
                {result.correct_answers} out of {result.total_questions} correct
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Details Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Details
            </Text>
            <List.Item
              title="Pass Mark"
              description={`${result.pass_mark}%`}
              left={props => <List.Icon {...props} icon="check-circle-outline" />}
            />
            <List.Item
              title="Time Taken"
              description={`${Math.floor(result.time_taken / 60)} minutes`}
              left={props => <List.Icon {...props} icon="clock-outline" />}
            />
            <List.Item
              title="Correct Answers"
              description={`${result.correct_answers} questions`}
              left={props => <List.Icon {...props} icon="check" />}
            />
            <List.Item
              title="Incorrect Answers"
              description={`${result.total_questions - result.correct_answers} questions`}
              left={props => <List.Icon {...props} icon="close" />}
            />
            {result.violations_count > 0 && (
              <List.Item
                title="Violations"
                description={`${result.violations_count} logged`}
                left={props => <List.Icon {...props} icon="alert" />}
                titleStyle={{ color: '#ef4444' }}
              />
            )}
          </Card.Content>
        </Card>

        {/* Question Review */}
        {result.answers && result.show_question_review && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Question Review
              </Text>
              {result.answers.map((answer, index) => (
                <View key={index} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewNumber}>Q{index + 1}</Text>
                    {answer.is_correct ? (
                      <Text style={styles.correctBadge}>✓ Correct</Text>
                    ) : (
                      <Text style={styles.incorrectBadge}>✗ Incorrect</Text>
                    )}
                  </View>
                  <RenderHTML
                    contentWidth={300}
                    source={{ html: answer.question_text }}
                    baseStyle={styles.reviewQuestion}
                    tagsStyles={{
                      sub: { fontSize: 10, lineHeight: 14 },
                      sup: { fontSize: 10, lineHeight: 14 },
                      strong: { fontWeight: 'bold' },
                      b: { fontWeight: 'bold' },
                      em: { fontStyle: 'italic' },
                      i: { fontStyle: 'italic' },
                      u: { textDecorationLine: 'underline' }
                    }}
                  />
                  <View style={styles.reviewAnswers}>
                    <Text style={styles.reviewAnswer}>
                      Your answer: <Text style={styles.reviewAnswerValue}>{answer.your_answer || 'Not answered'}</Text>
                    </Text>
                    {!answer.is_correct && (
                      <Text style={styles.reviewAnswer}>
                        Correct answer: <Text style={styles.correctAnswerValue}>{answer.correct_answer}</Text>
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Performance Analysis */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Performance Analysis
            </Text>
            <View style={styles.performanceBar}>
              <View style={styles.performanceBarFill} width={`${result.score_percentage}%`}>
                <View 
                  style={[
                    styles.performanceBarInner,
                    { width: `${result.score_percentage}%`, backgroundColor: passed ? '#10b981' : '#ef4444' }
                  ]}
                />
              </View>
            </View>
            <Text style={styles.performanceText}>
              {result.score_percentage >= 80
                ? 'Excellent performance! Keep it up!'
                : result.score_percentage >= 60
                ? 'Good job! There\'s room for improvement.'
                : result.score_percentage >= result.pass_mark
                ? 'You passed, but consider reviewing the material.'
                : 'We recommend reviewing the material and trying again.'}
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          mode="contained"
          onPress={handleReturnToLogin}
          style={styles.dashboardButton}
          icon="login"
        >
          Return to Login
        </Button>
      </View>
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
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    color: '#64748b',
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  passedCard: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
    borderWidth: 2,
  },
  failedCard: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
    borderWidth: 2,
  },
  resultContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  resultIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  resultStatus: {
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  resultMessage: {
    color: '#475569',
    textAlign: 'center',
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  scoreContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  scoreText: {
    fontWeight: 'bold',
    color: '#d97706',
    marginBottom: 8,
  },
  scoreDetails: {
    color: '#64748b',
  },
  reviewItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewNumber: {
    fontWeight: 'bold',
    color: '#1e293b',
    fontSize: 16,
  },
  correctBadge: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 14,
  },
  incorrectBadge: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 14,
  },
  reviewQuestion: {
    color: '#475569',
    marginBottom: 8,
    lineHeight: 20,
  },
  reviewAnswers: {
    marginTop: 8,
  },
  reviewAnswer: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: 4,
  },
  reviewAnswerValue: {
    fontWeight: 'bold',
    color: '#1e293b',
  },
  correctAnswerValue: {
    fontWeight: 'bold',
    color: '#10b981',
  },
  performanceBar: {
    height: 12,
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  performanceBarInner: {
    height: '100%',
    borderRadius: 6,
  },
  performanceText: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  dashboardButton: {
    paddingVertical: 4,
  },
});

