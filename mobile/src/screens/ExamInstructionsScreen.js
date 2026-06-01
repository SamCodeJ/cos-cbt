import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, List } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ExamInstructionsScreen({ route, navigation }) {
  const { exam } = route.params;
  const insets = useSafeAreaInsets();

  const handleStartExam = () => {
    navigation.navigate('Exam', { exam });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 16 }]}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Exam Instructions
        </Text>
        <Button mode="text" onPress={() => navigation.goBack()}>
          Back
        </Button>
      </View>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.examTitle}>
              {exam.title}
            </Text>
            <Text variant="bodyMedium" style={styles.examSubject}>
              {exam.subject}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Exam Details
            </Text>
            <List.Item
              title="Duration"
              description={`${exam.duration} minutes`}
              left={props => <List.Icon {...props} icon="clock-outline" />}
            />
            <List.Item
              title="Total Questions"
              description={`${exam.questions_per_candidate} questions`}
              left={props => <List.Icon {...props} icon="file-document-outline" />}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Important Instructions
            </Text>
            
            <View style={styles.instruction}>
              <Text style={styles.instructionNumber}>1.</Text>
              <Text style={styles.instructionText}>
                Read each question carefully before selecting your answer.
              </Text>
            </View>

            <View style={styles.instruction}>
              <Text style={styles.instructionNumber}>2.</Text>
              <Text style={styles.instructionText}>
                You can navigate between questions using the Previous/Next buttons or the question palette.
              </Text>
            </View>

            <View style={styles.instruction}>
              <Text style={styles.instructionNumber}>3.</Text>
              <Text style={styles.instructionText}>
                Flag questions for review if you're unsure. You can revisit them later.
              </Text>
            </View>

            <View style={styles.instruction}>
              <Text style={styles.instructionNumber}>4.</Text>
              <Text style={styles.instructionText}>
                The exam will automatically submit when the timer expires.
              </Text>
            </View>
          </Card.Content>
        </Card>

        {exam.enforce_screen_lock && (
          <Card style={[styles.card, styles.warningCard]}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.warningTitle}>
                ⚠️ Proctoring Warning
              </Text>
              <Text style={styles.warningText}>
                • Do NOT minimize this app during the exam
              </Text>
              <Text style={styles.warningText}>
                • Do NOT switch to other apps
              </Text>
              <Text style={styles.warningText}>
                • All violations will be logged
              </Text>
              <Text style={styles.warningText}>
                • After 3 violations, the exam may be auto-submitted
              </Text>
            </Card.Content>
          </Card>
        )}

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Before You Begin
            </Text>
            <Text style={styles.checklistText}>
              ✓ Ensure you have a stable internet connection
            </Text>
            <Text style={styles.checklistText}>
              ✓ Find a quiet place free from distractions
            </Text>
            <Text style={styles.checklistText}>
              ✓ Keep your device charged or plugged in
            </Text>
            <Text style={styles.checklistText}>
              ✓ Do not close or minimize the app during the exam
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          mode="contained"
          onPress={handleStartExam}
          style={styles.startButton}
          contentStyle={styles.startButtonContent}
        >
          I Understand, Start Exam
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#1e293b',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  examTitle: {
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  examSubject: {
    color: '#64748b',
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  instruction: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  instructionNumber: {
    fontWeight: 'bold',
    color: '#d97706',
    marginRight: 8,
    fontSize: 16,
  },
  instructionText: {
    flex: 1,
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
  },
  warningCard: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 2,
  },
  warningTitle: {
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 12,
  },
  warningText: {
    color: '#92400e',
    fontSize: 15,
    marginBottom: 6,
  },
  checklistText: {
    color: '#475569',
    fontSize: 15,
    marginBottom: 8,
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  startButton: {
    paddingVertical: 4,
  },
  startButtonContent: {
    paddingVertical: 8,
  },
});

