import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { examAPI } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Save, Upload, Plus, X, Loader2, Download, Trash2, ChevronLeft, ChevronRight, RefreshCw, Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const examSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  subject: z.string().min(2, 'Subject is required'),
  duration: z.number().min(10, 'Duration must be at least 10 minutes'),
  questions_per_candidate: z.number().min(1, 'Must have at least 1 question'),
  pass_mark: z.number().min(0).max(100, 'Pass mark must be between 0-100'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  status: z.enum(['draft', 'scheduled', 'active', 'completed']),
  show_results: z.boolean(),
  randomize_questions: z.boolean(),
  randomize_options: z.boolean(),
  enforce_screen_lock: z.boolean(),
  require_pin_check: z.boolean().optional().default(false),
  exam_pin: z.string().max(20).optional().nullable(),
}).refine((data) => {
  // Validate that end_date is after start_date
  if (data.start_date && data.end_date) {
    return new Date(data.end_date) > new Date(data.start_date);
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['end_date'],
});

export default function CreateExam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('basic');
  const [candidates, setCandidates] = useState([]);
  const [originalCandidates, setOriginalCandidates] = useState([]); // Track original candidates for editing
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(examSchema),
    defaultValues: {
      randomize_questions: true,
      randomize_options: false,
      enforce_screen_lock: true,
      require_pin_check: false,
      exam_pin: '',
      show_results: true,
      pass_mark: 50,
      status: 'draft',
    },
  });

  const showResults = watch('show_results');
  const randomizeQuestions = watch('randomize_questions');
  const randomizeOptions = watch('randomize_options');
  const enforceScreenLock = watch('enforce_screen_lock');
  const requirePinCheck = watch('require_pin_check');
  const questionsPerCandidate = watch('questions_per_candidate');

  useEffect(() => {
    if (id) {
      loadExam();
    }
  }, [id]);

  const loadExam = async () => {
    setIsLoading(true);
    try {
      const exam = await examAPI.get(id);
      
      // Convert dates to datetime-local format (YYYY-MM-DDTHH:mm)
      // Extract date/time without timezone conversion
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        // PostgreSQL returns: "2024-11-26T14:00:00.000Z" or "2024-11-26T14:00:00"
        // Extract just the date and time parts: "2024-11-26T14:00"
        const withoutTimezone = dateString.replace('Z', '').split('.')[0];
        return withoutTimezone.substring(0, 16);
      };

      Object.keys(exam).forEach(key => {
        // Format date fields for datetime-local inputs
        if (key === 'start_date' || key === 'end_date') {
          setValue(key, formatDateForInput(exam[key]));
        } else {
          setValue(key, exam[key]);
        }
      });

      const [candidatesData, questionsData] = await Promise.all([
        examAPI.getCandidates(id),
        examAPI.getQuestions(id),
      ]);

      setCandidates(candidatesData);
      setOriginalCandidates(candidatesData); // Store original for comparison on save
      setQuestions(questionsData);

      // Load section distribution settings if available
      if (exam.enable_section_distribution) {
        setEnableSectionDistribution(true);
        if (exam.section_distribution && Object.keys(exam.section_distribution).length > 0) {
          setSectionDistribution(exam.section_distribution);
        } else {
          // Auto-populate if distribution is empty
          setTimeout(() => populateAutoDistribution(), 200);
        }
      }
    } catch (error) {
      toast.error('Failed to load exam');
      navigate('/my-exams');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data) => {
    if (candidates.length === 0) {
      toast.error('Please add at least one candidate');
      setActiveTab('candidates');
      return;
    }

    if (questions.length === 0) {
      toast.error('Please add at least one question');
      setActiveTab('questions');
      return;
    }

    if (questions.length < data.questions_per_candidate) {
      toast.error(`You need at least ${data.questions_per_candidate} questions in the bank`);
      setActiveTab('questions');
      return;
    }

    // Validate section distribution if enabled
    if (enableSectionDistribution) {
      const sectionStats = getSectionStats();
      const totalToSelect = Object.values(sectionStats).reduce((sum, s) => sum + s.questionsToSelect, 0);
      
      if (totalToSelect !== data.questions_per_candidate) {
        toast.error(`Section distribution total (${totalToSelect}) must equal questions per candidate (${data.questions_per_candidate})`);
        setActiveTab('settings');
        return;
      }

      // Check if any section has more questions to select than available
      for (const [sectionName, section] of Object.entries(sectionStats)) {
        if (section.questionsToSelect > section.totalQuestions) {
          toast.error(`Section "${sectionName}" cannot select ${section.questionsToSelect} questions (only ${section.totalQuestions} available)`);
          setActiveTab('settings');
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      let examId = id;

      // Convert datetime-local format to ISO string for backend
      // Keep as-is without timezone to preserve the exact time entered
      const formatDateForBackend = (dateTimeLocal) => {
        if (!dateTimeLocal) return null;
        // datetime-local format: "YYYY-MM-DDTHH:mm"
        // Append seconds but NO timezone ('Z') to keep it as a naive datetime
        // PostgreSQL TIMESTAMP (without time zone) will store this exact time
        return `${dateTimeLocal}:00.000`;
      };

      const formattedData = {
        ...data,
        start_date: formatDateForBackend(data.start_date),
        end_date: formatDateForBackend(data.end_date),
        enable_section_distribution: enableSectionDistribution,
        section_distribution: enableSectionDistribution ? sectionDistribution : null,
      };

      if (id) {
        await examAPI.update(id, formattedData);

        // When editing, handle candidate deletions
        if (originalCandidates.length > 0) {
          // Find candidates that were removed (in original but not in current)
          const currentCandidateIds = new Set(candidates.map(c => c.id));
          const removedCandidates = originalCandidates.filter(
            c => !currentCandidateIds.has(c.id)
          );

          // Delete removed candidates
          if (removedCandidates.length > 0) {
            // Batch delete candidates if needed, but usually it's one by one or we can just use Promise.all for small amounts
            // To be safe with large deletions, we can batch them too
            const BATCH_SIZE = 50;
            for (let i = 0; i < removedCandidates.length; i += BATCH_SIZE) {
              const batch = removedCandidates.slice(i, i + BATCH_SIZE);
              await Promise.all(batch.map(c => examAPI.removeCandidate(examId, c.id)));
            }
          }

          // Find new candidates that need to be added (don't have an id from backend)
          const newCandidates = candidates.filter(c => !originalCandidates.some(oc => oc.id === c.id));
          
          if (newCandidates.length > 0) {
            const BATCH_SIZE = 250;
            for (let i = 0; i < newCandidates.length; i += BATCH_SIZE) {
              const batch = newCandidates.slice(i, i + BATCH_SIZE);
              await examAPI.addCandidates(examId, batch);
            }
          }

          // Replace all questions (clear and re-add)
          const BATCH_SIZE = 250;
          for (let i = 0; i < questions.length; i += BATCH_SIZE) {
            const batch = questions.slice(i, i + BATCH_SIZE);
            const isFirstBatch = i === 0;
            await examAPI.addQuestions(examId, batch, isFirstBatch); // replace=true only for the first batch
          }
        } else {
          // No original candidates, just add all
          const BATCH_SIZE = 250;
          for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
            const batch = candidates.slice(i, i + BATCH_SIZE);
            await examAPI.addCandidates(examId, batch);
          }

          for (let i = 0; i < questions.length; i += BATCH_SIZE) {
            const batch = questions.slice(i, i + BATCH_SIZE);
            const isFirstBatch = i === 0;
            await examAPI.addQuestions(examId, batch, isFirstBatch); // replace=true only for the first batch
          }
        }

        toast.success('Exam updated successfully');
      } else {
        const newExam = await examAPI.create(formattedData);
        examId = newExam.id;
        
        // Save candidates and questions for new exam in batches
        const BATCH_SIZE = 250;
        
        for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
          const batch = candidates.slice(i, i + BATCH_SIZE);
          await examAPI.addCandidates(examId, batch);
        }

        for (let i = 0; i < questions.length; i += BATCH_SIZE) {
          const batch = questions.slice(i, i + BATCH_SIZE);
          await examAPI.addQuestions(examId, batch);
        }

        toast.success('Exam created successfully');
      }

      navigate('/my-exams');
    } catch (error) {
      console.error('Save exam error:', error);
      const errorMessage = error.response?.data?.error 
        || error.response?.data?.message 
        || error.message
        || 'Failed to save exam';
      
      // Show validation errors if present
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => {
          toast.error(`${err.path || err.param}: ${err.msg}`);
        });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Candidate Management
  const [newCandidate, setNewCandidate] = useState({
    name: '',
    email: '',
    student_id: '',
    password: '',
  });
  const [candidatePage, setCandidatePage] = useState(1);
  const [candidatesPerPage, setCandidatesPerPage] = useState(10);
  const [candidateSearchQuery, setCandidateSearchQuery] = useState('');

  // Filtered candidates based on search
  const filteredCandidates = candidates.filter(candidate => {
    if (!candidateSearchQuery) return true;
    const query = candidateSearchQuery.toLowerCase();
    return (
      candidate.name?.toLowerCase().includes(query) ||
      candidate.email?.toLowerCase().includes(query) ||
      candidate.student_id?.toLowerCase().includes(query)
    );
  });

  const addCandidate = () => {
    if (!newCandidate.name || !newCandidate.email) {
      toast.error('Name and email are required');
      return;
    }

    // Generate random password if not provided
    const password = newCandidate.password || generateRandomPassword();

    setCandidates([...candidates, { ...newCandidate, password, id: Date.now() }]);
    setNewCandidate({ name: '', email: '', student_id: '', password: '' });

    // Show password in toast for teacher to copy
    toast.success(
      `✅ ${newCandidate.name} added!\n📧 Email: ${newCandidate.email}\n🔑 Password: ${password}\n\n⚠️ Save this password! It won't be visible after saving the exam.`,
      { duration: 10000 } // Show for 10 seconds
    );
  };

  // Helper function to generate random password
  const generateRandomPassword = () => {
    return Math.random().toString(36).slice(-8);
  };

  const removeCandidate = (id) => {
    setCandidates(candidates.filter(c => c.id !== id));
  };

  const handleCandidateCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target.result;
        const lines = csv.split('\n');
        const newCandidates = lines.slice(1).map((line, index) => {
          const [name, email, student_id, password] = line.split(',').map(s => s.trim());
          if (name && email) {
            // Generate random password if not provided in CSV
            const finalPassword = password || generateRandomPassword();
            return { id: Date.now() + index, name, email, student_id: student_id || '', password: finalPassword };
          }
          return null;
        }).filter(Boolean);

        setCandidates([...candidates, ...newCandidates]);
        
        // Show detailed success message with password info
        const passwordInfo = newCandidates.length <= 5 
          ? '\n\n📋 Passwords:\n' + newCandidates.map(c => `• ${c.name}: ${c.password}`).join('\n')
          : '';
        
        toast.success(
          `✅ Added ${newCandidates.length} candidate(s)!${passwordInfo}\n\n⚠️ Save these passwords! They won't be visible after saving the exam.`,
          { duration: 10000 }
        );
      } catch (error) {
        toast.error('Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Question Management
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    points: 1,
    is_multi_answer: false,
    section_id: '',
    instruction: '',
    passage: '',
  });
  const [selectedQuestions, setSelectedQuestions] = useState(new Set());
  const [questionPage, setQuestionPage] = useState(1);
  const [questionsPerPage, setQuestionsPerPage] = useState(10);
  const [questionSearchQuery, setQuestionSearchQuery] = useState('');

  // Filtered questions based on search
  const filteredQuestions = questions.filter(question => {
    if (!questionSearchQuery) return true;
    const query = questionSearchQuery.toLowerCase();
    return (
      question.question_text?.toLowerCase().includes(query) ||
      question.section_id?.toLowerCase().includes(query)
    );
  });
  
  // Section-based distribution settings
  const [enableSectionDistribution, setEnableSectionDistribution] = useState(false);
  const [sectionDistribution, setSectionDistribution] = useState({});

  const addQuestion = () => {
    if (!newQuestion.question_text || !newQuestion.option_a || !newQuestion.option_b) {
      toast.error('Question and at least 2 options are required');
      return;
    }

    setQuestions([...questions, { ...newQuestion, id: Date.now() }]);
    setNewQuestion({
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
      points: 1,
      is_multi_answer: false,
      section_id: '',
      instruction: '',
      passage: '',
    });
  };

  const removeQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
    setSelectedQuestions(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const toggleQuestionSelect = (id) => {
    setSelectedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAllQuestions = () => {
    if (selectedQuestions.size === questions.length) {
      // Deselect all
      setSelectedQuestions(new Set());
    } else {
      // Select all
      setSelectedQuestions(new Set(questions.map(q => q.id)));
    }
  };

  const deleteSelectedQuestions = () => {
    if (selectedQuestions.size === 0) {
      toast.error('No questions selected');
      return;
    }

    const count = selectedQuestions.size;
    setQuestions(questions.filter(q => !selectedQuestions.has(q.id)));
    setSelectedQuestions(new Set());
    toast.success(`Deleted ${count} question(s)`);
  };

  // Pagination helpers
  const getPaginatedItems = (items, page, itemsPerPage) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  const getTotalPages = (items, itemsPerPage) => {
    return Math.ceil(items.length / itemsPerPage);
  };

  // Paginated data
  const paginatedCandidates = getPaginatedItems(filteredCandidates, candidatePage, candidatesPerPage);
  const totalCandidatePages = getTotalPages(filteredCandidates, candidatesPerPage);

  const paginatedQuestions = getPaginatedItems(filteredQuestions, questionPage, questionsPerPage);
  const totalQuestionPages = getTotalPages(filteredQuestions, questionsPerPage);

  // Handlers for items per page change
  const handleCandidatesPerPageChange = (newPerPage) => {
    setCandidatesPerPage(newPerPage);
    setCandidatePage(1); // Reset to first page
  };

  const handleQuestionsPerPageChange = (newPerPage) => {
    setQuestionsPerPage(newPerPage);
    setQuestionPage(1); // Reset to first page
  };

  // Pagination component
  const Pagination = ({ currentPage, totalPages, onPageChange, itemName, itemsPerPage, onItemsPerPageChange }) => {
    const totalItems = itemName === 'candidates' ? filteredCandidates.length : filteredQuestions.length;
    
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
            Showing {startItem} to {endItem} of {totalItems} {itemName}
          </div>
          
          {/* Length Menu */}
          <div className="flex items-center gap-2">
            <Label htmlFor={`${itemName}-per-page`} className="text-sm text-slate-600">
              Show:
            </Label>
            <select
              id={`${itemName}-per-page`}
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

  const handleQuestionUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    const isDocx = file.name.toLowerCase().endsWith('.docx');
    const isCsv = file.name.toLowerCase().endsWith('.csv');

    if (isDocx) {
      // Handle Word document upload via backend
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/question-bank/preview-word', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to parse Word document');
        }

        const data = await response.json();
        
        if (data.questions && data.questions.length > 0) {
          const newQuestions = data.questions.map((q, index) => ({
            id: Date.now() + index,
            question_text: q.question_text,
            option_a: q.options?.A || '',
            option_b: q.options?.B || '',
            option_c: q.options?.C || '',
            option_d: q.options?.D || '',
            correct_answer: q.correct_answer || 'A',
            points: 1,
            is_multi_answer: q.is_multi_answer || false,
            section_id: q.section_id || '',
            instruction: q.instruction || '',
            passage: q.passage || '',
          }));

          setQuestions([...questions, ...newQuestions]);
          toast.success(`Added ${newQuestions.length} questions from Word document`);
          
          if (data.parseErrors && data.parseErrors.length > 0) {
            toast.warning(`${data.parseErrors.length} warning(s) during parsing`);
          }
        } else {
          toast.error('No valid questions found in the document');
        }
      } catch (error) {
        console.error('Word upload error:', error);
        toast.error(error.message || 'Failed to parse Word document');
      }
    } else if (isCsv) {
      // Handle CSV file (legacy support)
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const csv = event.target.result;
          const lines = csv.split('\n');
          const newQuestions = lines.slice(1).map((line, index) => {
            const fields = [];
            let current = '';
            let inQuotes = false;
            
            for (let char of line) {
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                fields.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            fields.push(current.trim());
            
            const [question_text, option_a, option_b, option_c, option_d, correct_answer, points, is_multi_answer] = fields;
            
            if (question_text && option_a && option_b) {
              return {
                id: Date.now() + index,
                question_text,
                option_a,
                option_b,
                option_c: option_c || '',
                option_d: option_d || '',
                correct_answer: correct_answer || 'A',
                points: parseInt(points) || 1,
                is_multi_answer: is_multi_answer?.toLowerCase() === 'true',
              };
            }
            return null;
          }).filter(Boolean);

          setQuestions([...questions, ...newQuestions]);
          toast.success(`Added ${newQuestions.length} questions from CSV`);
        } catch (error) {
          toast.error('Failed to parse CSV file');
        }
      };
      reader.readAsText(file);
    } else {
      toast.error('Please upload a .docx or .csv file');
    }
    
    e.target.value = '';
  };

  const downloadCandidateTemplate = () => {
    const csv = 'name,email,student_id,password\nJohn Doe,john@example.com,ST001,password123\nJane Smith,jane@example.com,ST002,securepass';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'candidates_template.csv';
    a.click();
  };

  const downloadQuestionTemplate = async () => {
    try {
      const response = await fetch('/api/question-bank/template', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to download template');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'questions_template.docx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Template download error:', error);
      toast.error('Failed to download template');
    }
  };

  // Calculate section statistics and distribution
  const getSectionStats = () => {
    const sections = {};
    
    questions.forEach(q => {
      const sectionName = q.section_id || 'Unsectioned';
      if (!sections[sectionName]) {
        sections[sectionName] = {
          name: sectionName,
          totalQuestions: 0,
          questionsToSelect: 0,
        };
      }
      sections[sectionName].totalQuestions++;
    });
    
    // Calculate automatic even distribution
    const sectionNames = Object.keys(sections);
    const numSections = sectionNames.length;
    const targetQuestionsPerCandidate = questionsPerCandidate || 0;
    
    if (numSections > 0 && targetQuestionsPerCandidate > 0) {
      const baseQuestionsPerSection = Math.floor(targetQuestionsPerCandidate / numSections);
      const remainder = targetQuestionsPerCandidate % numSections;
      
      sectionNames.forEach((sectionName, index) => {
        // Distribute remainder to first few sections
        const autoDistribution = baseQuestionsPerSection + (index < remainder ? 1 : 0);
        sections[sectionName].questionsToSelect = 
          sectionDistribution[sectionName] !== undefined 
            ? sectionDistribution[sectionName] 
            : autoDistribution;
      });
    }
    
    return sections;
  };

  // Update section distribution
  const updateSectionDistribution = (sectionName, value) => {
    setSectionDistribution(prev => ({
      ...prev,
      [sectionName]: parseInt(value) || 0,
    }));
  };

  // Reset to automatic distribution
  const resetToAutoDistribution = () => {
    setSectionDistribution({});
    toast.success('Reset to automatic distribution');
  };

  // Populate section distribution with automatic values when enabled
  const populateAutoDistribution = () => {
    const sectionStats = getSectionStats();
    const autoDistribution = {};
    
    Object.entries(sectionStats).forEach(([sectionName, stats]) => {
      autoDistribution[sectionName] = stats.questionsToSelect;
    });
    
    setSectionDistribution(autoDistribution);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {id ? 'Edit Exam' : 'Create New Exam'}
          </h1>
          <p className="text-slate-600">
            {id ? 'Update exam details and settings' : 'Set up a new examination with candidates and questions'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="candidates">Candidates ({candidates.length})</TabsTrigger>
              <TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Exam Details</CardTitle>
                  <CardDescription>Basic information about the exam</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Exam Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Mathematics Final Exam"
                        {...register('title')}
                        className={errors.title ? 'border-red-500' : ''}
                      />
                      {errors.title && (
                        <p className="text-sm text-red-500">{errors.title.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        placeholder="e.g., Mathematics"
                        {...register('subject')}
                        className={errors.subject ? 'border-red-500' : ''}
                      />
                      {errors.subject && (
                        <p className="text-sm text-red-500">{errors.subject.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (minutes) *</Label>
                      <Input
                        id="duration"
                        type="number"
                        placeholder="60"
                        {...register('duration', { valueAsNumber: true })}
                        className={errors.duration ? 'border-red-500' : ''}
                      />
                      {errors.duration && (
                        <p className="text-sm text-red-500">{errors.duration.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="questions_per_candidate">Questions Per Candidate *</Label>
                      <Input
                        id="questions_per_candidate"
                        type="number"
                        placeholder="40"
                        {...register('questions_per_candidate', { valueAsNumber: true })}
                        className={errors.questions_per_candidate ? 'border-red-500' : ''}
                      />
                      {errors.questions_per_candidate && (
                        <p className="text-sm text-red-500">{errors.questions_per_candidate.message}</p>
                      )}
                      <p className="text-xs text-slate-500">
                        Each candidate will receive this many random questions. Configure section-based distribution in Settings tab.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pass_mark">Pass Mark (%) *</Label>
                      <Input
                        id="pass_mark"
                        type="number"
                        placeholder="50"
                        {...register('pass_mark', { valueAsNumber: true })}
                        className={errors.pass_mark ? 'border-red-500' : ''}
                      />
                      {errors.pass_mark && (
                        <p className="text-sm text-red-500">{errors.pass_mark.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="start_date">Start Date & Time *</Label>
                      <Input
                        id="start_date"
                        type="datetime-local"
                        {...register('start_date')}
                        className={errors.start_date ? 'border-red-500' : ''}
                      />
                      {errors.start_date && (
                        <p className="text-sm text-red-500">{errors.start_date.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="end_date">End Date & Time *</Label>
                      <Input
                        id="end_date"
                        type="datetime-local"
                        {...register('end_date')}
                        className={errors.end_date ? 'border-red-500' : ''}
                      />
                      {errors.end_date && (
                        <p className="text-sm text-red-500">{errors.end_date.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Exam Status *</Label>
                      <select
                        id="status"
                        {...register('status')}
                        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                          errors.status ? 'border-red-500' : ''
                        }`}
                      >
                        <option value="draft">Draft</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                      </select>
                      {errors.status && (
                        <p className="text-sm text-red-500">{errors.status.message}</p>
                      )}
                      <p className="text-xs text-slate-500">
                        Draft: Not visible to candidates. Scheduled: Published but not yet started. Active: Currently available. Completed: Exam period has ended.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Candidates Tab */}
            <TabsContent value="candidates">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Manage Candidates</CardTitle>
                      <CardDescription>Add candidates manually or upload via CSV</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={downloadCandidateTemplate}>
                        <Download className="w-4 h-4 mr-2" />
                        Template
                      </Button>
                      <label>
                        <Button type="button" variant="outline" size="sm" asChild>
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload File
                          </span>
                        </Button>
                        <input
                          type="file"
                          accept=".csv"
                          className="hidden"
                          onChange={handleCandidateCSV}
                        />
                      </label>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Info Banner */}
                  {id && candidates.length > 0 && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex gap-2">
                        <span className="text-blue-600 text-sm">ℹ️</span>
                        <div className="text-sm text-blue-800">
                          <strong>Note:</strong> Passwords are only visible when first adding candidates. 
                          Existing candidate passwords are hidden for security. When you add new candidates 
                          to this exam, their passwords will be visible before saving.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Add Candidate Form */}
                  <div className="p-4 border border-slate-200 rounded-lg space-y-4">
                    <h4 className="font-semibold text-slate-900">Add New Candidate</h4>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <Input
                        placeholder="Full Name"
                        value={newCandidate.name}
                        onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                      />
                      <Input
                        type="email"
                        placeholder="Email"
                        value={newCandidate.email}
                        onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                      />
                      <Input
                        placeholder="Student ID (optional)"
                        value={newCandidate.student_id}
                        onChange={(e) => setNewCandidate({ ...newCandidate, student_id: e.target.value })}
                      />
                      <Input
                        type="text"
                        placeholder="Password (auto-generated if empty)"
                        value={newCandidate.password}
                        onChange={(e) => setNewCandidate({ ...newCandidate, password: e.target.value })}
                      />
                      <Button type="button" onClick={addCandidate} className="bg-amber-600 hover:bg-amber-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Candidates Table */}
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-slate-900">Added Candidates ({candidates.length})</h4>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        placeholder="Search candidates..."
                        value={candidateSearchQuery}
                        onChange={(e) => {
                          setCandidateSearchQuery(e.target.value);
                          setCandidatePage(1);
                        }}
                        className="pl-9 h-9"
                      />
                    </div>
                  </div>
                  
                  {candidates.length > 0 ? (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">S/N</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Student ID</TableHead>
                            <TableHead>Password</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedCandidates.map((candidate, index) => (
                          <TableRow key={candidate.id}>
                            <TableCell className="text-slate-500">
                              {(candidatePage - 1) * candidatesPerPage + index + 1}
                            </TableCell>
                            <TableCell>{candidate.name}</TableCell>
                            <TableCell>{candidate.email}</TableCell>
                            <TableCell>{candidate.student_id || '-'}</TableCell>
                            <TableCell>
                              {candidate.password ? (
                                <code className="px-2 py-1 bg-slate-100 rounded text-sm font-mono text-green-700">
                                  {candidate.password}
                                </code>
                              ) : (
                                <span className="text-sm text-slate-500 italic">
                                  Password set (hidden after save)
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeCandidate(candidate.id)}
                              >
                                <X className="w-4 h-4 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <Pagination 
                        currentPage={candidatePage}
                        totalPages={totalCandidatePages}
                        onPageChange={setCandidatePage}
                        itemName="candidates"
                        itemsPerPage={candidatesPerPage}
                        onItemsPerPageChange={handleCandidatesPerPageChange}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      No candidates added yet. Add candidates manually or upload a CSV file.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Questions Tab */}
            <TabsContent value="questions">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Manage Questions</CardTitle>
                      <CardDescription>Add questions manually or upload via CSV</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={downloadQuestionTemplate}>
                        <Download className="w-4 h-4 mr-2" />
                        Template
                      </Button>
                      <label>
                        <Button type="button" variant="outline" size="sm" asChild>
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload CSV
                          </span>
                        </Button>
                        <input
                          type="file"
                          accept=".docx,.csv"
                          className="hidden"
                          onChange={handleQuestionUpload}
                        />
                      </label>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Info Banner about Sections */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex gap-2">
                      <span className="text-blue-600 text-sm">💡</span>
                      <div className="text-sm text-blue-800">
                        <strong>Tip:</strong> Use <strong>Section Names</strong> to group questions by topic. 
                        You can then configure how many questions from each section students should answer in the <strong>Settings</strong> tab.
                      </div>
                    </div>
                  </div>

                  {/* Add Question Form */}
                  <div className="p-4 border border-slate-200 rounded-lg space-y-4">
                    <h4 className="font-semibold text-slate-900">Add New Question</h4>
                    <div className="space-y-3">
                      {/* Optional Section, Instruction, Passage Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          placeholder="Section Name (e.g., Algebra, Grammar, etc.)"
                          value={newQuestion.section_id}
                          onChange={(e) => setNewQuestion({ ...newQuestion, section_id: e.target.value })}
                        />
                        <Input
                          placeholder="Instruction (optional)"
                          value={newQuestion.instruction}
                          onChange={(e) => setNewQuestion({ ...newQuestion, instruction: e.target.value })}
                        />
                      </div>
                      <textarea
                        placeholder="Passage (optional) - Reading comprehension text for this question"
                        className="w-full min-h-[80px] rounded-md border border-input px-3 py-2 text-sm resize-y"
                        value={newQuestion.passage}
                        onChange={(e) => setNewQuestion({ ...newQuestion, passage: e.target.value })}
                      />
                      <Input
                        placeholder="Question Text"
                        value={newQuestion.question_text}
                        onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          placeholder="Option A"
                          value={newQuestion.option_a}
                          onChange={(e) => setNewQuestion({ ...newQuestion, option_a: e.target.value })}
                        />
                        <Input
                          placeholder="Option B"
                          value={newQuestion.option_b}
                          onChange={(e) => setNewQuestion({ ...newQuestion, option_b: e.target.value })}
                        />
                        <Input
                          placeholder="Option C (optional)"
                          value={newQuestion.option_c}
                          onChange={(e) => setNewQuestion({ ...newQuestion, option_c: e.target.value })}
                        />
                        <Input
                          placeholder="Option D (optional)"
                          value={newQuestion.option_d}
                          onChange={(e) => setNewQuestion({ ...newQuestion, option_d: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center space-x-2 mb-3">
                        <Checkbox
                          id="multi-answer-new"
                          checked={newQuestion.is_multi_answer}
                          onCheckedChange={(checked) => {
                            setNewQuestion({
                              ...newQuestion,
                              is_multi_answer: checked,
                              correct_answer: checked ? newQuestion.correct_answer : newQuestion.correct_answer.split(',')[0] || 'A'
                            });
                          }}
                        />
                        <Label htmlFor="multi-answer-new" className="text-sm font-normal cursor-pointer">
                          Multiple correct answers
                        </Label>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <Label className="text-sm">Correct Answer{newQuestion.is_multi_answer ? 's' : ''}</Label>
                          {newQuestion.is_multi_answer ? (
                            <div className="space-y-2 p-3 border rounded-md">
                              {['A', 'B', 'C', 'D'].map(option => {
                                const isDisabled = option === 'C' && !newQuestion.option_c || option === 'D' && !newQuestion.option_d;
                                const answers = newQuestion.correct_answer.split(',');
                                return (
                                  <div key={option} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`correct-${option}-new`}
                                      checked={answers.includes(option)}
                                      disabled={isDisabled}
                                      onCheckedChange={() => {
                                        const currentAnswers = newQuestion.correct_answer.split(',').filter(a => a);
                                        let newAnswers;
                                        if (currentAnswers.includes(option)) {
                                          newAnswers = currentAnswers.filter(a => a !== option);
                                        } else {
                                          newAnswers = [...currentAnswers, option];
                                        }
                                        const sortedAnswers = newAnswers.sort().join(',');
                                        setNewQuestion({ ...newQuestion, correct_answer: sortedAnswers || 'A' });
                                      }}
                                    />
                                    <Label htmlFor={`correct-${option}-new`} className="text-sm font-normal cursor-pointer">
                                      {option} {isDisabled && '(not provided)'}
                                    </Label>
                                  </div>
                                );
                              })}
                              <p className="text-xs text-slate-500 mt-2">
                                Selected: {newQuestion.correct_answer || 'None'}
                              </p>
                            </div>
                          ) : (
                            <select
                              className="w-full h-9 rounded-md border border-input px-3 py-1"
                              value={newQuestion.correct_answer}
                              onChange={(e) => setNewQuestion({ ...newQuestion, correct_answer: e.target.value })}
                            >
                              <option value="A">A</option>
                              <option value="B">B</option>
                              <option value="C">C</option>
                              <option value="D">D</option>
                            </select>
                          )}
                        </div>
                        <div className="flex-1">
                          <Label className="text-sm">Points</Label>
                          <Input
                            type="number"
                            value={newQuestion.points}
                            onChange={(e) => setNewQuestion({ ...newQuestion, points: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button type="button" onClick={addQuestion} className="bg-amber-600 hover:bg-amber-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Questions List */}
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-slate-900">Added Questions ({questions.length})</h4>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        placeholder="Search questions..."
                        value={questionSearchQuery}
                        onChange={(e) => {
                          setQuestionSearchQuery(e.target.value);
                          setQuestionPage(1);
                        }}
                        className="pl-9 h-9"
                      />
                    </div>
                  </div>
                  
                  {questions.length > 0 ? (
                    <div className="space-y-3">
                      {/* Bulk Actions Bar */}
                      <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="select-all-questions"
                            checked={selectedQuestions.size === questions.length && questions.length > 0}
                            onCheckedChange={toggleSelectAllQuestions}
                          />
                          <Label htmlFor="select-all-questions" className="cursor-pointer font-medium">
                            {selectedQuestions.size === questions.length && questions.length > 0
                              ? `All ${questions.length} questions selected`
                              : selectedQuestions.size > 0
                              ? `${selectedQuestions.size} of ${questions.length} selected`
                              : `Select All (${questions.length})`}
                          </Label>
                        </div>
                        
                        {selectedQuestions.size > 0 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={deleteSelectedQuestions}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Selected ({selectedQuestions.size})
                          </Button>
                        )}
                      </div>

                      {/* Questions */}
                      {paginatedQuestions.map((question, index) => {
                        const actualIndex = (questionPage - 1) * questionsPerPage + index;
                        const prevQuestion = index > 0 ? paginatedQuestions[index - 1] : null;
                        const showSectionHeader = question.section_id && 
                          (!prevQuestion || prevQuestion.section_id !== question.section_id);
                        
                        return (
                          <div key={question.id}>
                            {/* Section Header */}
                            {showSectionHeader && (
                              <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <h3 className="font-semibold text-amber-800 text-lg">
                                  📚 Section: {question.section_id}
                                </h3>
                                {question.instruction && (
                                  <p className="mt-1 text-sm text-amber-700">
                                    <span className="font-medium">Instructions:</span> {question.instruction}
                                  </p>
                                )}
                              </div>
                            )}
                            
                            <div className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                              <div className="flex gap-3 items-start">
                                <Checkbox
                                  id={`question-${question.id}`}
                                  checked={selectedQuestions.has(question.id)}
                                  onCheckedChange={() => toggleQuestionSelect(question.id)}
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  {/* Passage */}
                                  {question.passage && (
                                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                      <p className="text-sm font-medium text-blue-800 mb-1">📖 Passage:</p>
                                      <p className="text-sm text-blue-900 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: question.passage }} />
                                    </div>
                                  )}
                                  
                                  <h4 className="font-medium text-slate-900 mb-2">
                                    <span>{actualIndex + 1}. </span>
                                    <span dangerouslySetInnerHTML={{ __html: question.question_text }} />
                                    {question.is_multi_answer && (
                                      <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                                        Multi-Answer
                                      </span>
                                    )}
                                  </h4>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className={question.correct_answer?.includes('A') ? 'text-green-600 font-medium' : ''}>
                                      A: <span dangerouslySetInnerHTML={{ __html: question.option_a }} />
                                    </div>
                                    <div className={question.correct_answer?.includes('B') ? 'text-green-600 font-medium' : ''}>
                                      B: <span dangerouslySetInnerHTML={{ __html: question.option_b }} />
                                    </div>
                                    {question.option_c && (
                                      <div className={question.correct_answer?.includes('C') ? 'text-green-600 font-medium' : ''}>
                                        C: <span dangerouslySetInnerHTML={{ __html: question.option_c }} />
                                      </div>
                                    )}
                                    {question.option_d && (
                                      <div className={question.correct_answer?.includes('D') ? 'text-green-600 font-medium' : ''}>
                                        D: <span dangerouslySetInnerHTML={{ __html: question.option_d }} />
                                      </div>
                                    )}
                                  </div>
                                  <div className="mt-2 text-sm text-amber-600 font-medium">
                                    Correct Answer: {question.correct_answer} | Points: {question.points}
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeQuestion(question.id)}
                                >
                                  <X className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Pagination */}
                      <Pagination 
                        currentPage={questionPage}
                        totalPages={totalQuestionPages}
                        onPageChange={setQuestionPage}
                        itemName="questions"
                        itemsPerPage={questionsPerPage}
                        onItemsPerPageChange={handleQuestionsPerPageChange}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      No questions added yet. Add questions manually or upload a CSV file.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Exam Settings</CardTitle>
                  <CardDescription>Configure exam behavior and security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show_results">Show Results After Test</Label>
                      <p className="text-sm text-slate-500">
                        Allow candidates to view their results immediately after submission
                      </p>
                    </div>
                    <Switch
                      id="show_results"
                      checked={showResults}
                      onCheckedChange={(checked) => setValue('show_results', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="randomize_questions">Randomize Questions</Label>
                      <p className="text-sm text-slate-500">
                        Each candidate gets different random questions from the question bank
                      </p>
                    </div>
                    <Switch
                      id="randomize_questions"
                      checked={randomizeQuestions}
                      onCheckedChange={(checked) => setValue('randomize_questions', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="randomize_options">Randomize Answer Options</Label>
                      <p className="text-sm text-slate-500">
                        Shuffle the order of answer options for each question
                      </p>
                    </div>
                    <Switch
                      id="randomize_options"
                      checked={randomizeOptions}
                      onCheckedChange={(checked) => setValue('randomize_options', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enforce_screen_lock">Enforce Screen Lock</Label>
                      <p className="text-sm text-slate-500">
                        Prevent candidates from minimizing the app during the exam (mobile only)
                      </p>
                    </div>
                    <Switch
                      id="enforce_screen_lock"
                      checked={enforceScreenLock}
                      onCheckedChange={(checked) => setValue('enforce_screen_lock', checked)}
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="space-y-0.5">
                        <Label htmlFor="require_pin_check">Randomized PIN Verification</Label>
                        <p className="text-sm text-slate-500">
                          Randomly prompt students to enter a PIN written on the board during the exam to prevent remote cheating
                        </p>
                      </div>
                      <Switch
                        id="require_pin_check"
                        checked={requirePinCheck}
                        onCheckedChange={(checked) => setValue('require_pin_check', checked)}
                      />
                    </div>
                    
                    {requirePinCheck && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="exam_pin">Exam PIN *</Label>
                          <Input
                            id="exam_pin"
                            placeholder="e.g., 4928"
                            {...register('exam_pin')}
                            className={errors.exam_pin ? 'border-red-500' : ''}
                          />
                          {errors.exam_pin && (
                            <p className="text-sm text-red-500">{errors.exam_pin.message}</p>
                          )}
                          <p className="text-xs text-amber-800 mt-1">
                            Write this PIN on the board in the exam hall. Students will be randomly asked to enter it during the exam.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section-Based Question Distribution */}
                  <div className="pt-6 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="space-y-0.5">
                        <Label htmlFor="enable_section_distribution">Section-Based Question Distribution</Label>
                        <p className="text-sm text-slate-500">
                          Distribute questions evenly across sections for each student
                        </p>
                      </div>
                      <Switch
                        id="enable_section_distribution"
                        checked={enableSectionDistribution}
                        onCheckedChange={(checked) => {
                          setEnableSectionDistribution(checked);
                          // Auto-populate distribution when enabling (if not already set)
                          if (checked && Object.keys(sectionDistribution).length === 0) {
                            // Use setTimeout to ensure questions are loaded
                            setTimeout(() => populateAutoDistribution(), 100);
                          }
                        }}
                      />
                    </div>

                    {enableSectionDistribution && (() => {
                      const sectionStats = getSectionStats();
                      const sectionNames = Object.keys(sectionStats);
                      const totalToSelect = Object.values(sectionStats).reduce((sum, s) => sum + s.questionsToSelect, 0);
                      const hasValidDistribution = totalToSelect === (questionsPerCandidate || 0);

                      if (sectionNames.length === 0) {
                        return (
                          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm text-amber-800">
                              ⚠️ No questions added yet. Add questions with section IDs to configure distribution.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-4">
                          {/* Distribution Summary */}
                          <div className={`p-4 rounded-lg border ${
                            hasValidDistribution 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-amber-50 border-amber-200'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">
                                  {hasValidDistribution ? '✅' : '⚠️'} Distribution Summary
                                </p>
                                <p className="text-sm mt-1">
                                  Total to select: <strong>{totalToSelect}</strong> / Target: <strong>{questionsPerCandidate || 0}</strong>
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={resetToAutoDistribution}
                              >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Reset to Auto
                              </Button>
                            </div>
                            {!hasValidDistribution && (
                              <p className="text-xs text-amber-700 mt-2">
                                Adjust the distribution so the total matches the target questions per candidate.
                              </p>
                            )}
                          </div>

                          {/* Section Distribution Table */}
                          <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Section</TableHead>
                                  <TableHead className="text-center">Total Questions in Bank</TableHead>
                                  <TableHead className="text-center">Questions to Select per Student</TableHead>
                                  <TableHead className="text-center">% of Exam</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {sectionNames.map(sectionName => {
                                  const section = sectionStats[sectionName];
                                  const percentage = questionsPerCandidate > 0 
                                    ? ((section.questionsToSelect / questionsPerCandidate) * 100).toFixed(1)
                                    : 0;
                                  const isOverLimit = section.questionsToSelect > section.totalQuestions;

                                  return (
                                    <TableRow key={sectionName}>
                                      <TableCell className="font-medium">
                                        {section.name === 'Unsectioned' ? (
                                          <span className="text-slate-500 italic">{section.name}</span>
                                        ) : (
                                          <span>📚 {section.name}</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm font-medium">
                                          {section.totalQuestions}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                          <Input
                                            type="number"
                                            min="0"
                                            max={section.totalQuestions}
                                            value={section.questionsToSelect}
                                            onChange={(e) => updateSectionDistribution(sectionName, e.target.value)}
                                            className={`w-20 text-center ${
                                              isOverLimit ? 'border-red-500' : ''
                                            }`}
                                          />
                                          {isOverLimit && (
                                            <span className="text-xs text-red-500">Exceeds available</span>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <span className="text-sm text-slate-600">{percentage}%</span>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>

                          {/* Info Message */}
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                              💡 <strong>How it works:</strong> When a student starts the exam, the system will randomly select 
                              the specified number of questions from each section, ensuring an even distribution across all sections.
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/my-exams')}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-amber-600 hover:bg-amber-700"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {id ? 'Update Exam' : 'Create Exam'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

