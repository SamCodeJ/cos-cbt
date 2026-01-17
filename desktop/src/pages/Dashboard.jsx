import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidateAPI } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Clock, FileText, LogOut, User } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [candidate, setCandidate] = useState(null);

  useEffect(() => {
    const candidateData = localStorage.getItem('candidate_data');
    if (candidateData) {
      setCandidate(JSON.parse(candidateData));
    }
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const data = await candidateAPI.getExams();
      setExams(data);
    } catch (error) {
      console.error('Error loading exams:', error);
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('candidate_auth_token');
    localStorage.removeItem('candidate_data');
    navigate('/');
  };

  const getStatusBadge = (status) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-700',
      active: 'bg-green-100 text-green-700',
      completed: 'bg-slate-100 text-slate-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-amber-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading your exams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">UI</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">UI-GES Candidate Portal</h1>
                <p className="text-sm text-slate-600">{candidate?.name || 'Student'}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Exams</h2>
          <p className="text-slate-600">View and take your assigned exams</p>
        </div>

        {exams.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => (
              <Card key={exam.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg">{exam.title}</CardTitle>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(exam.status)}`}>
                      {exam.status}
                    </span>
                  </div>
                  <CardDescription>{exam.subject}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-slate-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{exam.duration} minutes</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <FileText className="w-4 h-4 mr-2" />
                      <span>{exam.questions_per_candidate} questions</span>
                    </div>
                    <div className="text-sm text-slate-600">
                      <strong>Start:</strong> {formatDateTime(exam.start_date)}
                    </div>
                  </div>

                  {exam.availability_message && !exam.has_taken && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-sm text-amber-800">{exam.availability_message}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {!exam.has_taken && (
                      <Button
                        className="flex-1"
                        onClick={() => navigate(`/exam-instructions/${exam.id}`, { state: { exam } })}
                        disabled={!exam.is_available}
                      >
                        {exam.is_available ? 'Start Exam' : 'Not Available'}
                      </Button>
                    )}
                    {exam.has_taken && exam.show_results && (
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => navigate(`/result/${exam.id}`)}
                      >
                        View Results
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Exams Assigned</h3>
              <p className="text-slate-600">You don't have any exams assigned yet. Please check back later.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
