import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ThankYouScreen({ route, navigation }) {
  const { examTitle } = route.params || {};
  const insets = useSafeAreaInsets();
  const { logout } = useAuthStore();

  const handleReturnToLogin = async () => {
    // Clear auth data
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('candidate');
    
    // Logout from store
    logout();
    
    // Navigate to login
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 16 }]}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Exam Submitted
        </Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="displaySmall" style={styles.icon}>
              ✅
            </Text>
            <Text variant="headlineMedium" style={styles.title}>
              Thank You!
            </Text>
            <Text variant="bodyLarge" style={styles.message}>
              Your exam has been submitted successfully.
            </Text>
            {examTitle && (
              <Text variant="bodyMedium" style={styles.examTitle}>
                {examTitle}
              </Text>
            )}
            <Text variant="bodyMedium" style={styles.subMessage}>
              Results will be shared by your teacher.
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.infoTitle}>
              What's Next?
            </Text>
            <Text variant="bodyMedium" style={styles.infoText}>
              • Your responses have been recorded{'\n'}
              • Your teacher will review and grade your exam{'\n'}
              • You will be notified when results are available{'\n'}
              • You can now safely close this application
            </Text>
          </Card.Content>
        </Card>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          mode="contained"
          onPress={handleReturnToLogin}
          style={styles.loginButton}
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
    justifyContent: 'center',
  },
  card: {
    marginBottom: 16,
    elevation: 4,
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
    borderWidth: 2,
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  icon: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    color: '#475569',
    textAlign: 'center',
    marginBottom: 8,
  },
  examTitle: {
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  subMessage: {
    color: '#64748b',
    textAlign: 'center',
    fontSize: 14,
  },
  infoCard: {
    marginBottom: 16,
    elevation: 2,
  },
  infoTitle: {
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  infoText: {
    color: '#475569',
    lineHeight: 24,
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  loginButton: {
    paddingVertical: 4,
  },
});
