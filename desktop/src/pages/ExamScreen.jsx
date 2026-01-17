import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { candidateAPI } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Flag, Grid3x3, AlertTriangle, Clock } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { convertImagePlaceholders } from '@/lib/imageUtils';

export default function ExamScreen() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const exam = location.state?.exam;

  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paletteVisible, setPaletteVisible] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [examStarted, setExamStarted] = useState(false);

  const timerRef = useRef(null);
  const timeCheckRef = useRef(null);
  const mountedRef = useRef(false);

  // Initialize exam only once
  useEffect(() => {
    if (mountedRef.current) return; // Already initialized
    mountedRef.current = true;

    const init = async () => {
      await initializeExam();
    };
    
    init();
    
    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (timeCheckRef.current) {
        clearInterval(timeCheckRef.current);
        timeCheckRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run once

  // Timer effect - only start when exam is started
  useEffect(() => {
    if (!examStarted || timeRemaining <= 0) return;

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    console.log('🕐 Starting timer with', timeRemaining, 'seconds remaining');

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [examStarted]); // Only depend on examStarted

  const initializeExam = async () => {
    try {
      const data = await candidateAPI.startExam(examId);
      
      // Get API base URL
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
      
      // Convert image placeholders to HTML img tags
      const questionsWithImages = (data.questions || []).map(q => ({
        ...q,
        question_text: convertImagePlaceholders(q.question_text, apiBaseUrl),
        option_a: convertImagePlaceholders(q.option_a, apiBaseUrl),
        option_b: convertImagePlaceholders(q.option_b, apiBaseUrl),
        option_c: convertImagePlaceholders(q.option_c, apiBaseUrl),
        option_d: convertImagePlaceholders(q.option_d, apiBaseUrl),
        passage: convertImagePlaceholders(q.passage, apiBaseUrl),
        instruction: convertImagePlaceholders(q.instruction, apiBaseUrl)
      }));
      
      setQuestions(questionsWithImages);
      const initialTime = data.time_remaining_seconds || exam?.duration * 60 || 0;
      setTimeRemaining(initialTime);
      
      console.log('📝 Exam initialized with', initialTime, 'seconds');
      console.log('🖼️ Images processed for', questionsWithImages.length, 'questions');
      
      // Load saved progress
      const saved = localStorage.getItem(`exam_${examId}_progress`);
      if (saved) {
        const progress = JSON.parse(saved);
        setAnswers(progress.answers || {});
        setFlagged(new Set(progress.flagged || []));
        setCurrentQuestionIndex(progress.currentQuestionIndex || 0);
      }

      // Start exam (triggers timer via useEffect)
      setExamStarted(true);
      
      // Start time check for extensions
      startTimeCheck();
    } catch (error) {
      console.error('Failed to start exam:', error);
      toast.error('Failed to start exam. Please try again.');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const startTimeCheck = () => {
    // Clear any existing time check
    if (timeCheckRef.current) {
      clearInterval(timeCheckRef.current);
      timeCheckRef.current = null;
    }
    
    timeCheckRef.current = setInterval(async () => {
      try {
        const response = await candidateAPI.getTimeRemaining(examId);
        if (response.time_remaining_seconds !== undefined) {
          const serverTime = parseInt(response.time_remaining_seconds);
          setTimeRemaining((currentTime) => {
            const difference = Math.abs(serverTime - currentTime);
            if (difference > 5) {
              if (serverTime > currentTime) {
                const addedMinutes = Math.floor((serverTime - currentTime) / 60);
                if (addedMinutes > 0) {
                  toast.success(`⏰ Time Extended: ${addedMinutes} minute(s) added!`);
                }
              }
              return serverTime;
            }
            return currentTime;
          });
        }
      } catch (error) {
        console.error('Time check error:', error);
      }
    }, 60000);
  };

  const saveProgress = () => {
    const progress = {
      answers,
      flagged: Array.from(flagged),
      currentQuestionIndex,
    };
    localStorage.setItem(`exam_${examId}_progress`, JSON.stringify(progress));
  };

  useEffect(() => {
    saveProgress();
  }, [answers, flagged, currentQuestionIndex]);

  const handleAnswerSelect = async (questionId, answer) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
    
    try {
      await candidateAPI.saveAnswer(examId, questionId, answer);
    } catch (error) {
      console.error('Failed to save answer:', error);
    }
  };

  const handleCheckboxToggle = async (questionId, option) => {
    const currentAnswer = answers[questionId] || '';
    const selectedOptions = currentAnswer ? currentAnswer.split(',') : [];
    
    let newSelectedOptions;
    if (selectedOptions.includes(option)) {
      newSelectedOptions = selectedOptions.filter(o => o !== option);
    } else {
      newSelectedOptions = [...selectedOptions, option];
    }
    
    const newAnswer = newSelectedOptions.sort().join(',');
    const newAnswers = { ...answers, [questionId]: newAnswer };
    setAnswers(newAnswers);
    
    try {
      await candidateAPI.saveAnswer(examId, questionId, newAnswer);
    } catch (error) {
      console.error('Failed to save answer:', error);
    }
  };

  const toggleFlag = () => {
    const questionId = questions[currentQuestionIndex].id;
    const newFlagged = new Set(flagged);
    if (newFlagged.has(questionId)) {
      newFlagged.delete(questionId);
    } else {
      newFlagged.add(questionId);
    }
    setFlagged(newFlagged);
  };

  const navigateQuestion = (direction) => {
    if (direction === 'next' && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitClick = () => {
    setSubmitDialogOpen(true);
  };

  const handleAutoSubmit = async () => {
    console.log('⏱️ Auto-submit triggered - Time expired');
    setExamStarted(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (timeCheckRef.current) {
      clearInterval(timeCheckRef.current);
      timeCheckRef.current = null;
    }
    
    await submitExam('Time expired - exam duration completed');
  };

  const submitExam = async (reason = null) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setExamStarted(false); // Stop timer

    // Clear all timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (timeCheckRef.current) {
      clearInterval(timeCheckRef.current);
      timeCheckRef.current = null;
    }

    try {
      const formattedAnswers = questions.map((q) => ({
        question_id: q.id,
        answer: answers[q.id] || null,
      }));

      await candidateAPI.submitExam(examId, formattedAnswers, []);
      localStorage.removeItem(`exam_${examId}_progress`);

      if (reason) {
        toast.success(reason);
      }

      if (exam?.show_results) {
        navigate(`/result/${examId}`);
      } else {
        navigate('/dashboard');
        toast.success('Exam submitted successfully!');
      }
    } catch (error) {
      console.error('Failed to submit exam:', error);
      toast.error('Failed to submit exam. Please try again.');
      setIsSubmitting(false);
    }
  };

  const getQuestionStatus = (questionId) => {
    if (answers[questionId]) return 'answered';
    if (flagged.has(questionId)) return 'flagged';
    return 'unanswered';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-amber-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-16 h-16 text-amber-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Questions Available</h3>
            <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const unansweredCount = questions.length - Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-slate-900">Exam in Progress</h1>
            <div className="text-right">
              <p className="text-sm text-slate-600">Question {currentQuestionIndex + 1} of {questions.length}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Left Column - Question Content */}
          <div className="flex-1 overflow-auto p-6">
            <Card className="max-w-4xl mx-auto">
              <CardContent className="p-6">
              {/* Section Header - Show if this question has a section */}
              {currentQuestion?.section_id && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded">
                  <h3 className="text-lg font-semibold text-amber-900 mb-2">
                    📚 Section: {currentQuestion.section_id}
                  </h3>
                  {currentQuestion?.instruction && (
                    <div className="mt-2">
                      <p className="font-semibold text-amber-800 mb-1">Instructions:</p>
                      <div 
                        className="text-sm text-amber-900 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: currentQuestion.instruction }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Passage - Show if this question has a passage */}
              {currentQuestion?.passage && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
                  <div 
                    className="text-sm text-blue-900 leading-relaxed italic"
                    dangerouslySetInnerHTML={{ __html: currentQuestion.passage }}
                  />
                </div>
              )}

              {/* Question Header */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-amber-600">
                  Question {currentQuestionIndex + 1}
                </h3>
              </div>

              {/* Question Text */}
              <div 
                className="text-lg mb-6 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: currentQuestion.question_text }}
              />

              {/* Options */}
              {currentQuestion.is_multi_answer ? (
                <div className="space-y-4">
                  <p className="text-sm text-amber-600 font-medium">Select all correct answers</p>
                  {['A', 'B', 'C', 'D'].map((option) => {
                    const optionKey = `option_${option.toLowerCase()}`;
                    const optionText = currentQuestion[optionKey];
                    if (!optionText?.trim()) return null;

                    const currentAnswer = answers[currentQuestion.id] || '';
                    const isChecked = currentAnswer.split(',').includes(option);

                    return (
                      <div key={option} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => handleCheckboxToggle(currentQuestion.id, option)}
                        />
                        <Label className="flex-1 cursor-pointer">
                          <span className="font-semibold mr-2">{option}:</span>
                          <span dangerouslySetInnerHTML={{ __html: optionText }} />
                        </Label>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <RadioGroup
                  value={answers[currentQuestion.id] || ''}
                  onValueChange={(value) => handleAnswerSelect(currentQuestion.id, value)}
                  className="space-y-4"
                >
                  {['A', 'B', 'C', 'D'].map((option) => {
                    const optionKey = `option_${option.toLowerCase()}`;
                    const optionText = currentQuestion[optionKey];
                    if (!optionText?.trim()) return null;

                    return (
                      <div key={option} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                        <RadioGroupItem value={option} id={`option-${option}`} />
                        <Label htmlFor={`option-${option}`} className="flex-1 cursor-pointer">
                          <span className="font-semibold mr-2">{option}:</span>
                          <span dangerouslySetInnerHTML={{ __html: optionText }} />
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Navigation Panel */}
          <div className="w-80 bg-white border-l shadow-lg overflow-auto">
            <div className="p-6 space-y-6">
              {/* Timer */}
              <div className={`p-4 rounded-lg ${timeRemaining < 300 ? 'bg-amber-50 border-2 border-amber-300' : 'bg-slate-50 border-2 border-slate-200'}`}>
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Clock className={`w-6 h-6 ${timeRemaining < 300 ? 'text-amber-600' : 'text-slate-600'}`} />
                  <span className={`text-3xl font-bold ${timeRemaining < 300 ? 'text-amber-600' : 'text-slate-900'}`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
                <p className="text-xs text-center text-slate-600">Time Remaining</p>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Progress</span>
                  <span className="font-semibold text-slate-900">
                    {Object.keys(answers).length}/{questions.length}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-amber-600 h-2 rounded-full transition-all"
                    style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-slate-600">{unansweredCount} unanswered</p>
              </div>

              {/* Flag Button */}
              <Button
                variant={flagged.has(currentQuestion.id) ? "default" : "outline"}
                className="w-full"
                onClick={toggleFlag}
              >
                <Flag className="w-4 h-4 mr-2" />
                {flagged.has(currentQuestion.id) ? 'Unflag Question' : 'Flag for Review'}
              </Button>

              {/* Navigation Buttons */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigateQuestion('prev')}
                  disabled={currentQuestionIndex === 0}
                >
                  ← Previous Question
                </Button>

                {!isLastQuestion ? (
                  <Button 
                    className="w-full"
                    onClick={() => navigateQuestion('next')}
                  >
                    Next Question →
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmitClick} 
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Submit Exam
                  </Button>
                )}
              </div>

              {/* Question Palette Preview */}
              <div className="border-t pt-4">
                <Button
                  variant="outline"
                  className="w-full mb-3"
                  onClick={() => setPaletteVisible(true)}
                >
                  <Grid3x3 className="w-4 h-4 mr-2" />
                  View All Questions
                </Button>

                {/* Legend */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 border border-green-300 rounded" />
                    <span className="text-slate-600">Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-amber-100 border border-amber-300 rounded" />
                    <span className="text-slate-600">Flagged</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-slate-100 border border-slate-300 rounded" />
                    <span className="text-slate-600">Unanswered</span>
                  </div>
                </div>

                {/* Mini Question Grid */}
                <div className="grid grid-cols-5 gap-1 mt-3">
                  {questions.slice(0, 10).map((q, index) => {
                    const status = getQuestionStatus(q.id);
                    const statusColors = {
                      answered: 'bg-green-100 border-green-300',
                      flagged: 'bg-amber-100 border-amber-300',
                      unanswered: 'bg-slate-100 border-slate-300',
                    };
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQuestionIndex(index)}
                        className={`aspect-square border text-xs font-semibold rounded hover:scale-110 transition-transform ${
                          statusColors[status]
                        } ${index === currentQuestionIndex ? 'ring-2 ring-amber-600' : ''}`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
                {questions.length > 10 && (
                  <p className="text-xs text-slate-500 mt-2 text-center">
                    +{questions.length - 10} more questions
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Palette Dialog */}
      <Dialog open={paletteVisible} onOpenChange={setPaletteVisible}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Question Palette</DialogTitle>
            <DialogDescription>
              Click on any question number to navigate
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-6 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 border border-green-300 rounded" />
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-100 border border-amber-300 rounded" />
              <span>Flagged</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-100 border border-slate-300 rounded" />
              <span>Unanswered</span>
            </div>
          </div>

          <div className="grid grid-cols-8 gap-2">
            {questions.map((q, index) => {
              const status = getQuestionStatus(q.id);
              const statusColors = {
                answered: 'bg-green-100 border-green-300 text-green-700',
                flagged: 'bg-amber-100 border-amber-300 text-amber-700',
                unanswered: 'bg-slate-100 border-slate-300 text-slate-700',
              };

              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setCurrentQuestionIndex(index);
                    setPaletteVisible(false);
                  }}
                  className={`w-full aspect-square border-2 rounded font-semibold hover:scale-110 transition-transform ${
                    statusColors[status]
                  } ${index === currentQuestionIndex ? 'ring-2 ring-amber-600' : ''}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Submit Confirmation Dialog */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Exam?</DialogTitle>
            <DialogDescription>
              You have answered {Object.keys(answers).length} out of {questions.length} questions.
              {unansweredCount > 0 && (
                <span className="block mt-2 text-amber-600 font-medium">
                  {unansweredCount} question(s) are unanswered.
                </span>
              )}
              <span className="block mt-2">Are you sure you want to submit?</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitDialogOpen(false)}>
              Go Back
            </Button>
            <Button
              onClick={() => {
                setSubmitDialogOpen(false);
                submitExam();
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
