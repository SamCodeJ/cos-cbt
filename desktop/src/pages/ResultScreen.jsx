import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { candidateAPI } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Loader2, Award, Clock, FileText, CheckCircle, XCircle, Home } from 'lucide-react';

export default function ResultScreen() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadResult();
  }, [examId]);

  const loadResult = async () => {
    try {
      const data = await candidateAPI.getResult(examId);
      setResult(data);
    } catch (error) {
      console.error('Failed to load result:', error);
      let errorMessage = 'Failed to load results.';
      if (error.response?.status === 403) {
        errorMessage = 'You are not authorized to view these results.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Results not found or not yet available.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-amber-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Unable to Load Results</h3>
            <p className="text-slate-600 mb-4">{error}</p>
            <Button onClick={() => navigate('/dashboard')}>
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scorePercentage = Number(result.score_percentage);
  const passMark = Number(result.pass_mark);
  const passed = scorePercentage >= passMark;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-xl font-bold text-slate-900 text-center">Exam Results</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Result Status */}
        <Card className={`border-2 ${passed ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">{passed ? '🎉' : '😔'}</div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              {passed ? 'Congratulations!' : 'Keep Trying!'}
            </h2>
            <p className="text-lg text-slate-700">
              {passed
                ? 'You have passed the examination!'
                : 'You did not meet the pass mark this time.'}
            </p>
          </CardContent>
        </Card>

        {/* Score Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="w-6 h-6 mr-2 text-amber-600" />
              Your Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className="text-6xl font-bold text-amber-600 mb-2">
                {result.score_percentage}%
              </div>
              <p className="text-slate-600">
                {result.correct_answers} out of {result.total_questions} correct
              </p>
            </div>
            <Progress value={result.score_percentage} className="h-4" />
          </CardContent>
        </Card>

        {/* Details */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Award className="w-5 h-5 mr-2 text-amber-600" />
                Pass Mark
            </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{result.pass_mark}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Clock className="w-5 h-5 mr-2 text-amber-600" />
                Time Taken
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{Math.floor(result.time_taken / 60)} min</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                Correct Answers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{result.correct_answers}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <XCircle className="w-5 h-5 mr-2 text-red-600" />
                Incorrect Answers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">
                {result.total_questions - result.correct_answers}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Question Review */}
        {result.answers && result.show_question_review && (
          <Card>
            <CardHeader>
              <CardTitle>Question Review</CardTitle>
              <CardDescription>Review your answers for each question</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.answers.map((answer, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    answer.is_correct
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-slate-900">Question {index + 1}</span>
                    <span className={`text-sm font-bold ${answer.is_correct ? 'text-green-600' : 'text-red-600'}`}>
                      {answer.is_correct ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                  </div>
                  <div
                    className="text-slate-700 mb-3"
                    dangerouslySetInnerHTML={{ __html: answer.question_text }}
                  />
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Your answer:</span>{' '}
                      <span className={answer.is_correct ? 'text-green-600' : 'text-red-600'}>
                        {answer.your_answer || 'Not answered'}
                      </span>
                    </p>
                    {!answer.is_correct && (
                      <p>
                        <span className="font-medium">Correct answer:</span>{' '}
                        <span className="text-green-600 font-medium">{answer.correct_answer}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Performance Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={result.score_percentage} className="h-3 mb-4" />
            <p className="text-slate-700">
              {result.score_percentage >= 80
                ? '🌟 Excellent performance! Keep it up!'
                : result.score_percentage >= 60
                ? '👍 Good job! There\'s room for improvement.'
                : result.score_percentage >= result.pass_mark
                ? '✅ You passed, but consider reviewing the material.'
                : '📚 We recommend reviewing the material and trying again.'}
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="py-6">
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                localStorage.removeItem('candidate_auth_token');
                localStorage.removeItem('candidate_data');
                navigate('/');
              }}
            >
              <Home className="w-5 h-5 mr-2" />
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
