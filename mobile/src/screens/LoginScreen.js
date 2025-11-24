import React, { useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, Card, ActivityIndicator } from 'react-native-paper';
import { candidateAPI } from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { setToken, setCandidate } = useAuthStore();

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
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
              secureTextEntry
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
    padding: 20,
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
    textAlign: 'center',
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

