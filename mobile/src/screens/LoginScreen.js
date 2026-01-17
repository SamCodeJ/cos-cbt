import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, Card, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { candidateAPI, testConnection } from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const hasTestedConnection = useRef(false);
  
  const { setToken, setCandidate } = useAuthStore();

  // Test connection on component mount (only once)
  useEffect(() => {
    // Prevent multiple calls (React StrictMode in dev can cause double renders)
    if (hasTestedConnection.current) return;
    hasTestedConnection.current = true;
    
    const checkConnection = async () => {
      setTestingConnection(true);
      const result = await testConnection();
      setConnectionStatus(result);
      setTestingConnection(false);
      
      if (!result.success) {
        console.log('⚠️  Backend connection test failed on login screen load');
      }
    };
    
    checkConnection();
  }, []);

  const handleLogin = async () => {
    setError('');
    
    if (!studentId || !password) {
      setError('Please enter both Student ID and password');
      return;
    }

    setLoading(true);
    try {
      const data = await candidateAPI.login(studentId, password);
      setToken(data.token);
      setCandidate(data.candidate);
      navigation.replace('Dashboard');
    } catch (err) {
      // Enhanced error messages based on error type
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        errorMessage = '❌ Cannot reach server.\n\n' +
          '1. Check if backend is running\n' +
          '2. Verify you\'re on the same WiFi\n' +
          '3. Check IP address in app settings';
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = '⏱️ Connection timeout. Server is not responding.\n\nPlease check if the backend server is running.';
      } else if (err.response?.status === 401) {
        errorMessage = '🔐 Invalid Student ID or password.\n\nPlease check your credentials and try again.';
      } else if (err.response?.status === 403) {
        errorMessage = '🚫 Account is deactivated.\n\nPlease contact your teacher.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      setError(errorMessage);
      console.error('Login error details:', {
        code: err.code,
        status: err.response?.status,
        message: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={[
        styles.scrollContent, 
        { 
          paddingTop: Math.max(insets.top, 20) + 20,
          paddingBottom: Math.max(insets.bottom, 20) + 20 
        }
      ]}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>UI-GES</Text>
          <Text style={styles.subtitle}>Computer-Based Testing System</Text>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.cardTitle}>
              Candidate Login
            </Text>
            <Text variant="bodyMedium" style={styles.cardSubtitle}>
              Enter your credentials to access your exams
            </Text>

            {/* Connection Status Indicator */}
            {connectionStatus && !connectionStatus.success && (
              <View style={styles.warningBox}>
                <Text style={styles.warningTitle}>⚠️ Connection Warning</Text>
                <Text style={styles.warningText}>Backend server may not be reachable</Text>
                <Text style={styles.warningSubtext}>
                  Make sure the backend server is running on {connectionStatus.attemptedUrl?.replace('/health', '') || 'your computer'}
                </Text>
                <Button 
                  mode="text" 
                  onPress={async () => {
                    if (testingConnection) return;
                    setTestingConnection(true);
                    const result = await testConnection(0); // No retries on manual test
                    setConnectionStatus(result);
                    setTestingConnection(false);
                  }}
                  style={styles.retryButton}
                  disabled={testingConnection}
                >
                  {testingConnection ? 'Testing...' : 'Test Connection Again'}
                </Button>
              </View>
            )}

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            <TextInput
              label="Student ID"
              value={studentId}
              onChangeText={setStudentId}
              mode="outlined"
              autoCapitalize="characters"
              style={styles.input}
              disabled={loading}
              placeholder="Enter your Student ID"
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              style={styles.input}
              disabled={loading}
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              style={styles.button}
              disabled={loading}
              loading={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Card.Content>
        </Card>

        <Text variant="bodySmall" style={styles.footerText}>
          Teachers and Admins: Please use the web portal
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  card: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1e293b',
  },
  cardSubtitle: {
    color: '#64748b',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 4,
  },
  errorText: {
    color: '#ef4444',
    marginBottom: 16,
    textAlign: 'left',
    fontSize: 13,
    lineHeight: 20,
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  warningTitle: {
    color: '#92400e',
    fontWeight: 'bold',
    marginBottom: 4,
    fontSize: 14,
  },
  warningText: {
    color: '#92400e',
    fontSize: 12,
    marginBottom: 4,
  },
  warningSubtext: {
    color: '#92400e',
    fontSize: 11,
    marginBottom: 8,
    opacity: 0.8,
  },
  retryButton: {
    marginTop: 4,
  },
  footerText: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 24,
  },
});

