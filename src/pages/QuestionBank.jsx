import React, { useState, useEffect } from 'react';
import { questionBankAPI } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Upload, Download, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  const [formData, setFormData] = useState({
    question_text: '',
    subject: '',
    difficulty: 'medium',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    points: 1,
  });

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    filterQuestions();
  }, [searchQuery, subjectFilter, difficultyFilter, questions]);

  const loadQuestions = async () => {
    try {
      const data = await questionBankAPI.list();
      setQuestions(data);
    } catch (error) {
      toast.error('Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  };

  const filterQuestions = () => {
    let filtered = [...questions];

    if (searchQuery) {
      filtered = filtered.filter(q =>
        q.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.subject?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (subjectFilter !== 'all') {
      filtered = filtered.filter(q => q.subject === subjectFilter);
    }

    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(q => q.difficulty === difficultyFilter);
    }

    setFilteredQuestions(filtered);
  };

  const handleSave = async () => {
    try {
      if (editingQuestion) {
        await questionBankAPI.update(editingQuestion.id, formData);
        toast.success('Question updated successfully');
      } else {
        await questionBankAPI.create(formData);
        toast.success('Question added successfully');
      }
      loadQuestions();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to save question');
    }
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    setFormData(question);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      await questionBankAPI.delete(id);
      toast.success('Question deleted successfully');
      setQuestions(questions.filter(q => q.id !== id));
    } catch (error) {
      toast.error('Failed to delete question');
    }
  };

  const resetForm = () => {
    setEditingQuestion(null);
    setFormData({
      question_text: '',
      subject: '',
      difficulty: 'medium',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
      points: 1,
    });
  };

  const getDifficultyBadge = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return <Badge className="bg-green-500">Easy</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500">Medium</Badge>;
      case 'hard':
        return <Badge className="bg-red-500">Hard</Badge>;
      default:
        return <Badge>{difficulty}</Badge>;
    }
  };

  const uniqueSubjects = [...new Set(questions.map(q => q.subject).filter(Boolean))];

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-64"></div>
          <div className="h-96 bg-slate-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Question Bank</h1>
            <p className="text-slate-600">Manage your reusable question library</p>
          </div>
          <Button
            className="bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Question
          </Button>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b border-slate-200">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {uniqueSubjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {filteredQuestions.length > 0 ? (
              <div className="space-y-4">
                {filteredQuestions.map((question, index) => (
                  <div key={question.id} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getDifficultyBadge(question.difficulty)}
                          {question.subject && (
                            <Badge variant="outline">{question.subject}</Badge>
                          )}
                        </div>
                        <h4 className="font-medium text-slate-900 mb-2">
                          {index + 1}. {question.question_text}
                        </h4>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(question)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(question.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className={question.correct_answer === 'A' ? 'text-green-600 font-medium' : ''}>
                          A: {question.option_a}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={question.correct_answer === 'B' ? 'text-green-600 font-medium' : ''}>
                          B: {question.option_b}
                        </span>
                      </div>
                      {question.option_c && (
                        <div className="flex items-center gap-2">
                          <span className={question.correct_answer === 'C' ? 'text-green-600 font-medium' : ''}>
                            C: {question.option_c}
                          </span>
                        </div>
                      )}
                      {question.option_d && (
                        <div className="flex items-center gap-2">
                          <span className={question.correct_answer === 'D' ? 'text-green-600 font-medium' : ''}>
                            D: {question.option_d}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Points: {question.points} | Usage: {question.usage_count || 0} exam(s)
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <BookOpen className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">
                  {searchQuery || subjectFilter !== 'all' || difficultyFilter !== 'all'
                    ? 'No questions found'
                    : 'No questions in the bank yet'}
                </h3>
                <p className="text-slate-500 mb-6">
                  {searchQuery || subjectFilter !== 'all' || difficultyFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : 'Add questions to build your question bank'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Question Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add New Question'}</DialogTitle>
            <DialogDescription>
              Fill in the question details below
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Question Text *</Label>
              <Input
                value={formData.question_text}
                onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                placeholder="Enter your question"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., Mathematics"
                />
              </div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Option A *</Label>
              <Input
                value={formData.option_a}
                onChange={(e) => setFormData({ ...formData, option_a: e.target.value })}
                placeholder="First option"
              />
            </div>

            <div className="space-y-2">
              <Label>Option B *</Label>
              <Input
                value={formData.option_b}
                onChange={(e) => setFormData({ ...formData, option_b: e.target.value })}
                placeholder="Second option"
              />
            </div>

            <div className="space-y-2">
              <Label>Option C (optional)</Label>
              <Input
                value={formData.option_c}
                onChange={(e) => setFormData({ ...formData, option_c: e.target.value })}
                placeholder="Third option"
              />
            </div>

            <div className="space-y-2">
              <Label>Option D (optional)</Label>
              <Input
                value={formData.option_d}
                onChange={(e) => setFormData({ ...formData, option_d: e.target.value })}
                placeholder="Fourth option"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Correct Answer *</Label>
                <Select
                  value={formData.correct_answer}
                  onValueChange={(value) => setFormData({ ...formData, correct_answer: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="D">D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Points</Label>
                <Input
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700">
              {editingQuestion ? 'Update' : 'Add'} Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

