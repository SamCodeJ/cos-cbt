import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, Card, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { candidateAPI, testConnection } from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState(null);
  
  const { setToken, setCandidate } = useAuthStore();

  // Test connection on component mount
  useEffect(() => {
    const checkConnection = async () => {
      const result = await testConnection();
      setConnectionStatus(result);
      
      if (!result.success) {
        console.log('⚠️  Backend connection test failed on login screen load');
      }
    };
    
    checkConnection();
  }, []);

  const handleLogin = async () => {
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const data = await candidateAPI.login(email, password);
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
        errorMessage = '🔐 Invalid email or password.\n\nPlease check your credentials and try again.';
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
          <View style={styles.logo}>
            <Text style={styles.logoText}>UI</Text>
          </View>
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
                <Button 
                  mode="text" 
                  onPress={async () => {
                    const result = await testConnection();
                    setConnectionStatus(result);
                  }}
                  style={styles.retryButton}
                >
                  Test Connection Again
                </Button>
              </View>
            )}

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              disabled={loading}
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

            <View style={styles.demoCredentials}>
              <Text variant="bodySmall" style={styles.demoText}>
                Demo Credentials:
              </Text>
              <Text variant="bodySmall" style={styles.demoEmail}>
                candidate@uiges.com / password
              </Text>
            </View>
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
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#d97706',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
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
    marginBottom: 8,
  },
  retryButton: {
    marginTop: 4,
  },
  demoCredentials: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'center',
  },
  demoText: {
    color: '#64748b',
    marginBottom: 4,
  },
  demoEmail: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#1e293b',
  },
  footerText: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 24,
  },
});

