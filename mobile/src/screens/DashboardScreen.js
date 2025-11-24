import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Chip, ActivityIndicator } from 'react-native-paper';
import { candidateAPI } from '../api/client';
import { useAuthStore } from '../store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DashboardScreen({ navigation }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { candidate, logout } = useAuthStore();

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const data = await candidateAPI.getExams();
      setExams(data);
    } catch (error) {
      console.error('Error loading exams:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadExams();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('candidate');
    logout();
    navigation.replace('Login');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return '#3b82f6';
      case 'active': return '#10b981';
      case 'completed': return '#64748b';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading your exams...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            Welcome Back
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            {candidate?.name || 'Student'}
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <Button 
            mode="text" 
            onPress={() => navigation.navigate('Profile')} 
            textColor="#d97706"
            icon="account"
          >
            Profile
          </Button>
        </View>
      </View>

      {/* Exams List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {exams.length > 0 ? (
          exams.map((exam) => (
            <Card key={exam.id} style={styles.examCard}>
              <Card.Content>
                <View style={styles.examHeader}>
                  <Text variant="titleLarge" style={styles.examTitle}>
                    {exam.title}
                  </Text>
                  <Chip 
                    style={{ backgroundColor: getStatusColor(exam.status) }}
                    textStyle={{ color: '#fff', fontSize: 12 }}
                  >
                    {exam.status}
                  </Chip>
                </View>

                <Text variant="bodyMedium" style={styles.examSubject}>
                  {exam.subject}
                </Text>

                <View style={styles.examDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Duration:</Text>
                    <Text style={styles.detailValue}>{exam.duration} minutes</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Questions:</Text>
                    <Text style={styles.detailValue}>{exam.questions_per_candidate}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Start Date:</Text>
                    <Text style={styles.detailValue}>{formatDate(exam.start_date)}</Text>
                  </View>
                </View>

                <View style={styles.examActions}>
                  <Button
                    mode="outlined"
                    onPress={() => navigation.navigate('ExamInstructions', { exam })}
                    style={styles.actionButton}
                  >
                    View Instructions
                  </Button>
                  
                  {exam.status === 'active' && !exam.has_taken && (
                    <Button
                      mode="contained"
                      onPress={() => navigation.navigate('ExamInstructions', { exam })}
                      style={styles.actionButton}
                    >
                      Start Exam
                    </Button>
                  )}
                  
                  {exam.has_taken && exam.show_results && (
                    <Button
                      mode="contained"
                      onPress={() => navigation.navigate('Result', { examId: exam.id })}
                      style={styles.actionButton}
                      buttonColor="#10b981"
                    >
                      View Results
                    </Button>
                  )}
                </View>
              </Card.Content>
            </Card>
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Text variant="titleMedium" style={styles.emptyTitle}>
                No Exams Assigned
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                You don't have any exams assigned yet. Please check back later.
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
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
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerSubtitle: {
    color: '#64748b',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  examCard: {
    marginBottom: 16,
    elevation: 2,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  examTitle: {
    flex: 1,
    fontWeight: 'bold',
    color: '#1e293b',
    marginRight: 8,
  },
  examSubject: {
    color: '#64748b',
    marginBottom: 16,
  },
  examDetails: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    color: '#64748b',
    fontSize: 14,
  },
  detailValue: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '500',
  },
  examActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  emptyCard: {
    marginTop: 40,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
  },
});

