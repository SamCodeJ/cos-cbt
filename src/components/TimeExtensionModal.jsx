import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Clock, Users, User, Loader2 } from 'lucide-react';
import { examAPI } from '@/api/client';

export default function TimeExtensionModal({ 
  open, 
  onOpenChange, 
  examId, 
  examTitle,
  onSuccess 
}) {
  const [activeStudents, setActiveStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [extending, setExtending] = useState(false);
  const [globalMinutes, setGlobalMinutes] = useState('');
  const [individualMinutes, setIndividualMinutes] = useState({});

  useEffect(() => {
    if (open && examId) {
      loadActiveStudents();
    }
  }, [open, examId]);

  const loadActiveStudents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/exams/${examId}/active-students`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to load students');
      }
      
      const data = await response.json();
      setActiveStudents(data);
    } catch (error) {
      console.error('Load students error:', error);
      toast.error('Failed to load student list');
    } finally {
      setLoading(false);
    }
  };

  const handleExtendAll = async () => {
    const minutes = parseInt(globalMinutes);
    
    if (!minutes || minutes < 1) {
      toast.error('Please enter a valid number of minutes');
      return;
    }

    setExtending(true);
    try {
      const response = await fetch(`/api/exams/${examId}/extend-time`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ minutes }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to extend time');
      }

      const result = await response.json();
      toast.success(`✅ Added ${minutes} minutes for all students!`, {
        description: `Total extension: ${result.total_extension_minutes} minutes`,
      });
      
      setGlobalMinutes('');
      loadActiveStudents();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Extend time error:', error);
      toast.error(error.message || 'Failed to extend time');
    } finally {
      setExtending(false);
    }
  };

  const handleExtendIndividual = async (studentId, studentName) => {
    const minutes = parseInt(individualMinutes[studentId]);
    
    if (!minutes || minutes < 1) {
      toast.error('Please enter a valid number of minutes');
      return;
    }

    setExtending(true);
    try {
      const response = await fetch(`/api/exams/${examId}/extend-time/${studentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ minutes }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to extend time');
      }

      const result = await response.json();
      toast.success(`✅ Added ${minutes} minutes for ${studentName}!`, {
        description: `Total individual extension: ${result.total_extension_minutes} minutes`,
      });
      
      setIndividualMinutes({ ...individualMinutes, [studentId]: '' });
      loadActiveStudents();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Extend individual time error:', error);
      toast.error(error.message || 'Failed to extend time');
    } finally {
      setExtending(false);
    }
  };

  const formatTimeRemaining = (minutes) => {
    if (minutes === null || minutes === undefined) return '-';
    const hrs = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const activeInProgressStudents = activeStudents.filter(s => s.status === 'in_progress');
  const completedStudents = activeStudents.filter(s => s.status === 'submitted' || s.status === 'auto_submitted');
  const notStartedStudents = activeStudents.filter(s => !s.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Extend Exam Time
          </DialogTitle>
          <DialogDescription>
            Add extra time to the exam for all students or specific individuals
          </DialogDescription>
          {examTitle && (
            <div className="text-sm font-medium text-slate-700 mt-2">
              📝 {examTitle}
            </div>
          )}
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Global Extension */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-amber-700" />
                <h3 className="font-semibold text-amber-900">Extend Time for All Students</h3>
              </div>
              <p className="text-sm text-amber-800 mb-4">
                This will add time to all students currently taking or yet to start the exam.
              </p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="global-minutes">Additional Minutes</Label>
                  <Input
                    id="global-minutes"
                    type="number"
                    min="1"
                    placeholder="e.g., 15"
                    value={globalMinutes}
                    onChange={(e) => setGlobalMinutes(e.target.value)}
                    disabled={extending}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleExtendAll}
                    disabled={!globalMinutes || extending}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    {extending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Extending...
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 mr-2" />
                        Extend All
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Individual Extensions */}
            {activeInProgressStudents.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-slate-700" />
                  <h3 className="font-semibold text-slate-900">Active Students ({activeInProgressStudents.length})</h3>
                </div>
                <div className="space-y-3">
                  {activeInProgressStudents.map((student) => (
                    <div 
                      key={student.id} 
                      className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">{student.name}</div>
                          <div className="text-sm text-slate-600">{student.email}</div>
                          <div className="flex gap-4 mt-2 text-xs">
                            <span className={`font-medium ${
                              student.time_remaining_minutes < 10 
                                ? 'text-red-600' 
                                : 'text-green-600'
                            }`}>
                              ⏱️ Time Left: {formatTimeRemaining(student.time_remaining_minutes)}
                            </span>
                            {(student.time_extension_minutes > 0) && (
                              <span className="text-blue-600">
                                +{student.time_extension_minutes} min (individual)
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min="1"
                            placeholder="Minutes"
                            className="w-24"
                            value={individualMinutes[student.id] || ''}
                            onChange={(e) => setIndividualMinutes({
                              ...individualMinutes,
                              [student.id]: e.target.value
                            })}
                            disabled={extending}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleExtendIndividual(student.id, student.name)}
                            disabled={!individualMinutes[student.id] || extending}
                            variant="outline"
                          >
                            <Clock className="w-4 h-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Not Started Students */}
            {notStartedStudents.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-700 mb-2">
                  Not Started ({notStartedStudents.length})
                </h3>
                <div className="text-sm text-slate-600 space-y-1">
                  {notStartedStudents.slice(0, 5).map((student) => (
                    <div key={student.id}>• {student.name}</div>
                  ))}
                  {notStartedStudents.length > 5 && (
                    <div className="text-slate-500 italic">
                      ... and {notStartedStudents.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Completed Students */}
            {completedStudents.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-700 mb-2">
                  Completed ({completedStudents.length})
                </h3>
                <div className="text-sm text-slate-500 italic">
                  {completedStudents.length} student(s) have already submitted their exam
                </div>
              </div>
            )}

            {activeStudents.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                No students assigned to this exam yet.
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

