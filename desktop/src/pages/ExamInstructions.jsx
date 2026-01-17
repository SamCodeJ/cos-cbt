import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, FileText, Award, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function ExamInstructions() {
  const navigate = useNavigate();
  const location = useLocation();
  const exam = location.state?.exam;

  if (!exam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-16 h-16 text-amber-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Exam Not Found</h3>
            <p className="text-slate-600 mb-4">Please select an exam from the dashboard.</p>
            <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleStartExam = () => {
    navigate(`/exam/${exam.id}`, { state: { exam } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-slate-900">Exam Instructions</h1>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Exam Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{exam.title}</CardTitle>
            <CardDescription className="text-base">{exam.subject}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                <Clock className="w-8 h-8 text-amber-600" />
                <div>
                  <p className="text-sm text-slate-600">Duration</p>
                  <p className="font-semibold">{exam.duration} minutes</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                <FileText className="w-8 h-8 text-amber-600" />
                <div>
                  <p className="text-sm text-slate-600">Questions</p>
                  <p className="font-semibold">{exam.questions_per_candidate}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                <Award className="w-8 h-8 text-amber-600" />
                <div>
                  <p className="text-sm text-slate-600">Pass Mark</p>
                  <p className="font-semibold">{exam.pass_mark}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Important Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <p className="text-slate-700">Read each question carefully before selecting your answer.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <p className="text-slate-700">You can navigate between questions using the Previous/Next buttons or the question palette.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <p className="text-slate-700">Flag questions for review if you're unsure. You can revisit them later.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
              <p className="text-slate-700">The exam will automatically submit when the timer expires.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-sm font-bold">5</div>
              <p className="text-slate-700">Your answers are saved automatically.</p>
            </div>
          </CardContent>
        </Card>

        {/* Browser Warning */}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-900 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Important Notice
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-amber-800">
            <p>• Do NOT close your browser or navigate away during the exam</p>
            <p>• Ensure you have a stable internet connection</p>
            <p>• Find a quiet place free from distractions</p>
            <p>• Keep your device charged or plugged in</p>
          </CardContent>
        </Card>

        {/* Start Button */}
        <Card>
          <CardContent className="py-6">
            <Button
              size="lg"
              className="w-full text-lg"
              onClick={handleStartExam}
            >
              I Understand, Start Exam
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
