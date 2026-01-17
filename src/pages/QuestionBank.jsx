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
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, Edit, Trash2, Upload, Download, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
    is_multi_answer: false,
  });

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    filterQuestions();
    setCurrentPage(1); // Reset to first page when filters change
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
      is_multi_answer: false,
    });
  };

  // Handle multi-answer checkbox toggle
  const handleCorrectAnswerToggle = (option) => {
    if (!formData.is_multi_answer) {
      // Single answer mode - just set the value
      setFormData({ ...formData, correct_answer: option });
    } else {
      // Multi-answer mode - toggle the option in comma-separated list
      const currentAnswers = formData.correct_answer.split(',').filter(a => a);
      let newAnswers;
      
      if (currentAnswers.includes(option)) {
        // Remove the option
        newAnswers = currentAnswers.filter(a => a !== option);
      } else {
        // Add the option
        newAnswers = [...currentAnswers, option];
      }
      
      // Sort and join
      const sortedAnswers = newAnswers.sort().join(',');
      setFormData({ ...formData, correct_answer: sortedAnswers || 'A' });
    }
  };

  // Check if an option is selected as correct
  const isCorrectAnswer = (option) => {
    const answers = formData.correct_answer.split(',');
    return answers.includes(option);
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

  // Pagination helpers
  const getPaginatedItems = (items, page, itemsPerPage) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  const getTotalPages = (items, itemsPerPage) => {
    return Math.ceil(items.length / itemsPerPage);
  };

  const handleItemsPerPageChange = (newPerPage) => {
    setItemsPerPage(newPerPage);
    setCurrentPage(1); // Reset to first page
  };

  // Paginated data
  const paginatedQuestions = getPaginatedItems(filteredQuestions, currentPage, itemsPerPage);
  const totalPages = getTotalPages(filteredQuestions, itemsPerPage);

  // Pagination component
  const Pagination = ({ currentPage, totalPages, onPageChange, itemsPerPage, onItemsPerPageChange }) => {
    const totalItems = filteredQuestions.length;
    
    if (totalItems === 0) return null;

    const pages = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    const startItem = ((currentPage - 1) * itemsPerPage) + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-600">
            Showing {startItem} to {endItem} of {totalItems} questions
          </div>
          
          {/* Length Menu */}
          <div className="flex items-center gap-2">
            <Label htmlFor="questions-per-page" className="text-sm text-slate-600">
              Show:
            </Label>
            <select
              id="questions-per-page"
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="h-8 rounded-md border border-slate-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
        
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          {startPage > 1 && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onPageChange(1)}
              >
                1
              </Button>
              {startPage > 2 && <span className="px-2 py-1">...</span>}
            </>
          )}
          
          {pages.map(page => (
            <Button
              key={page}
              type="button"
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              className={currentPage === page ? "bg-amber-600 hover:bg-amber-700" : ""}
            >
              {page}
            </Button>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="px-2 py-1">...</span>}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onPageChange(totalPages)}
              >
                {totalPages}
              </Button>
            </>
          )}
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

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
              <>
                <div className="space-y-4">
                  {paginatedQuestions.map((question, index) => (
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
                          <span>{(currentPage - 1) * itemsPerPage + index + 1}. </span>
                          <span dangerouslySetInnerHTML={{ __html: question.question_text }} />
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
                          A: <span dangerouslySetInnerHTML={{ __html: question.option_a }} />
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={question.correct_answer === 'B' ? 'text-green-600 font-medium' : ''}>
                          B: <span dangerouslySetInnerHTML={{ __html: question.option_b }} />
                        </span>
                      </div>
                      {question.option_c && (
                        <div className="flex items-center gap-2">
                          <span className={question.correct_answer === 'C' ? 'text-green-600 font-medium' : ''}>
                            C: <span dangerouslySetInnerHTML={{ __html: question.option_c }} />
                          </span>
                        </div>
                      )}
                      {question.option_d && (
                        <div className="flex items-center gap-2">
                          <span className={question.correct_answer === 'D' ? 'text-green-600 font-medium' : ''}>
                            D: <span dangerouslySetInnerHTML={{ __html: question.option_d }} />
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
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              </>
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

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="multi-answer"
                  checked={formData.is_multi_answer}
                  onCheckedChange={(checked) => {
                    setFormData({ 
                      ...formData, 
                      is_multi_answer: checked,
                      correct_answer: checked ? formData.correct_answer : formData.correct_answer.split(',')[0] || 'A'
                    });
                  }}
                />
                <Label htmlFor="multi-answer" className="text-sm font-normal cursor-pointer">
                  Multiple correct answers (use checkboxes)
                </Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Correct Answer{formData.is_multi_answer ? 's' : ''} *</Label>
                {formData.is_multi_answer ? (
                  <div className="space-y-2 p-3 border rounded-md">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="correct-a"
                        checked={isCorrectAnswer('A')}
                        onCheckedChange={() => handleCorrectAnswerToggle('A')}
                      />
                      <Label htmlFor="correct-a" className="text-sm font-normal cursor-pointer">
                        Option A
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="correct-b"
                        checked={isCorrectAnswer('B')}
                        onCheckedChange={() => handleCorrectAnswerToggle('B')}
                      />
                      <Label htmlFor="correct-b" className="text-sm font-normal cursor-pointer">
                        Option B
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="correct-c"
                        checked={isCorrectAnswer('C')}
                        onCheckedChange={() => handleCorrectAnswerToggle('C')}
                        disabled={!formData.option_c}
                      />
                      <Label htmlFor="correct-c" className="text-sm font-normal cursor-pointer">
                        Option C {!formData.option_c && '(not provided)'}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="correct-d"
                        checked={isCorrectAnswer('D')}
                        onCheckedChange={() => handleCorrectAnswerToggle('D')}
                        disabled={!formData.option_d}
                      />
                      <Label htmlFor="correct-d" className="text-sm font-normal cursor-pointer">
                        Option D {!formData.option_d && '(not provided)'}
                      </Label>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Selected: {formData.correct_answer || 'None'}
                    </p>
                  </div>
                ) : (
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
                )}
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

