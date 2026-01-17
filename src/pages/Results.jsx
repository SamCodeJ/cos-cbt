import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { resultsAPI, examAPI } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart3, Download, Search, FileText, CheckCircle, XCircle, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate, formatDateTime, formatDuration } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function Results() {
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(searchParams.get('exam') || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterResults();
    setCurrentPage(1); // Reset to first page when filters change
  }, [selectedExam, searchQuery, results]);

  const loadData = async () => {
    try {
      const [resultsData, examsData] = await Promise.all([
        resultsAPI.list(),
        examAPI.list(),
      ]);
      
      console.log('Results API Response:', resultsData);
      console.log('Exams API Response:', examsData);
      
      // Handle both array and object responses
      const resultsArray = Array.isArray(resultsData) ? resultsData : (resultsData.results || []);
      const examsArray = Array.isArray(examsData) ? examsData : (examsData.exams || []);
      
      console.log('Processed Results:', resultsArray);
      console.log('Processed Exams:', examsArray);
      
      setResults(resultsArray);
      setExams(examsArray);
      
      if (resultsArray.length === 0) {
        console.warn('No results found. Check if candidates have submitted exams.');
      }
    } catch (error) {
      console.error('Error loading results:', error);
      toast.error(`Failed to load results: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const filterResults = () => {
    let filtered = [...results];

    if (selectedExam !== 'all') {
      // Convert both to strings for comparison to handle type mismatches
      filtered = filtered.filter(r => String(r.exam_id) === String(selectedExam));
      
      console.log('Filtering by exam:', selectedExam);
      console.log('Total results:', results.length);
      console.log('Filtered results:', filtered.length);
      console.log('Sample result exam_id:', results[0]?.exam_id, 'Type:', typeof results[0]?.exam_id);
      console.log('Selected exam ID:', selectedExam, 'Type:', typeof selectedExam);
    }

    if (searchQuery) {
      filtered = filtered.filter(r =>
        r.candidate_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.candidate_email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredResults(filtered);
  };

  const getPassFailStats = () => {
    const passed = filteredResults.filter(r => r.passed).length;
    const failed = filteredResults.length - passed;
    return [
      { name: 'Passed', value: passed, color: '#10b981' },
      { name: 'Failed', value: failed, color: '#ef4444' },
    ];
  };

  const getScoreDistribution = () => {
    const ranges = [
      { name: '0-20%', min: 0, max: 20, count: 0 },
      { name: '21-40%', min: 21, max: 40, count: 0 },
      { name: '41-60%', min: 41, max: 60, count: 0 },
      { name: '61-80%', min: 61, max: 80, count: 0 },
      { name: '81-100%', min: 81, max: 100, count: 0 },
    ];

    filteredResults.forEach(r => {
      const range = ranges.find(rng => r.score_percentage >= rng.min && r.score_percentage <= rng.max);
      if (range) range.count++;
    });

    return ranges;
  };

  const handleDownloadTranscript = async (resultId) => {
    try {
      const blob = await resultsAPI.getTranscript(resultId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript_${resultId}.pdf`;
      a.click();
      toast.success('Transcript downloaded');
    } catch (error) {
      toast.error('Failed to download transcript');
    }
  };

  const handleViewDetails = async (result) => {
    setSelectedResult(result);
    setDetailsDialogOpen(true);
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

  const handleItemsPerPageChange = (newPerPage) => {
    setItemsPerPage(newPerPage);
    setCurrentPage(1); // Reset to first page
  };

  // Paginated data
  const paginatedResults = getPaginatedItems(filteredResults, currentPage, itemsPerPage);
  const totalPages = getTotalPages(filteredResults, itemsPerPage);

  // Pagination component
  const Pagination = ({ currentPage, totalPages, onPageChange, itemsPerPage, onItemsPerPageChange }) => {
    const totalItems = filteredResults.length;
    
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
            Showing {startItem} to {endItem} of {totalItems} results
          </div>
          
          {/* Length Menu */}
          <div className="flex items-center gap-2">
            <Label htmlFor="results-per-page" className="text-sm text-slate-600">
              Show:
            </Label>
            <select
              id="results-per-page"
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

  const handleExportCSV = () => {
    if (filteredResults.length === 0) {
      toast.error('No results to export');
      return;
    }

    // Create CSV headers
    const headers = [
      'Candidate Name',
      'Email',
      'Student ID',
      'Exam Title',
      'Score (%)',
      'Correct Answers',
      'Total Questions',
      'Status',
      'Time Taken (minutes)',
      'Violations',
      'Submitted At',
      'Started At'
    ];

    // Create CSV rows
    const rows = filteredResults.map(result => {
      const exam = exams.find(e => String(e.id) === String(result.exam_id));
      return [
        result.candidate_name || '',
        result.candidate_email || '',
        result.student_id || '',
        exam?.title || 'N/A',
        result.score_percentage || 0,
        result.correct_answers || 0,
        result.total_questions || 0,
        result.passed ? 'Passed' : 'Failed',
        result.time_taken || 0,
        result.violations_count || 0,
        result.submitted_at ? new Date(result.submitted_at).toLocaleString() : '',
        result.started_at ? new Date(result.started_at).toLocaleString() : ''
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const examName = selectedExam !== 'all' 
      ? exams.find(e => String(e.id) === selectedExam)?.title || 'exam'
      : 'all-exams';
    const timestamp = new Date().toISOString().split('T')[0];
    link.download = `${examName.replace(/\s+/g, '-')}-results-${timestamp}.csv`;
    
    link.click();
    window.URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredResults.length} results to CSV`);
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Exam Results</h1>
          <p className="text-slate-600">View and analyze candidate performance</p>
        </div>

        {/* Analytics Cards */}
        {filteredResults.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Pass/Fail Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={getPassFailStats()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getPassFailStats().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={getScoreDistribution()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#d97706" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results Table */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b border-slate-200">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search candidates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedExam} onValueChange={setSelectedExam}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="All Exams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Exams</SelectItem>
                  {exams.map(exam => (
                    <SelectItem key={exam.id} value={String(exam.id)}>
                      {exam.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleExportCSV}
                disabled={filteredResults.length === 0}
                className="w-full md:w-auto"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredResults.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">S/N</TableHead>
                        <TableHead>Candidate</TableHead>
                        <TableHead>Exam</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Time Taken</TableHead>
                        <TableHead>Violations</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedResults.map((result, index) => (
                        <TableRow key={result.id} className="hover:bg-slate-50">
                          <TableCell className="text-slate-500">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{result.candidate_name}</div>
                              <div className="text-sm text-slate-500">{result.candidate_email}</div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {exams.find(e => String(e.id) === String(result.exam_id))?.title || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-semibold">{result.score_percentage}%</div>
                              <div className="text-xs text-slate-500">
                                {result.correct_answers}/{result.total_questions} correct
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {result.passed ? (
                              <Badge variant="success" className="flex items-center gap-1 w-fit">
                                <CheckCircle className="w-3 h-3" />
                                Passed
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                <XCircle className="w-3 h-3" />
                                Failed
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{formatDuration(result.time_taken)}</TableCell>
                          <TableCell>
                            {result.violations_count > 0 ? (
                              <Badge variant="warning" className="flex items-center gap-1 w-fit">
                                <AlertTriangle className="w-3 h-3" />
                                {result.violations_count}
                              </Badge>
                            ) : (
                              <span className="text-slate-500">None</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDateTime(result.submitted_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(result)}
                              >
                                <FileText className="w-4 h-4 mr-1" />
                                Details
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadTranscript(result.id)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
                <BarChart3 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">
                  {searchQuery || selectedExam !== 'all' ? 'No results found' : 'No results yet'}
                </h3>
                <p className="text-slate-500 mb-4">
                  {searchQuery || selectedExam !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : 'Results will appear here once candidates complete and submit their exams'}
                </p>
                {results.length === 0 && (
                  <div className="text-sm text-slate-400 mt-4 p-4 bg-slate-50 rounded-lg inline-block">
                    <p className="font-medium mb-2">Troubleshooting tips:</p>
                    <ul className="text-left space-y-1">
                      <li>• Ensure candidates have completed their exams</li>
                      <li>• Check that exams are in "active" or "completed" status</li>
                      <li>• Verify candidates submitted their answers</li>
                      <li>• Check browser console for any API errors</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Details Dialog */}
      {selectedResult && (
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Exam Result Details</DialogTitle>
              <DialogDescription>
                Detailed breakdown of {selectedResult.candidate_name}'s performance
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <ResultLabel className="text-sm text-slate-500">Candidate</ResultLabel>
                  <p className="font-medium">{selectedResult.candidate_name}</p>
                  <p className="text-sm text-slate-500">{selectedResult.candidate_email}</p>
                </div>
                <div>
                  <ResultLabel className="text-sm text-slate-500">Exam</ResultLabel>
                  <p className="font-medium">
                    {exams.find(e => String(e.id) === String(selectedResult.exam_id))?.title}
                  </p>
                </div>
                <div>
                  <ResultLabel className="text-sm text-slate-500">Score</ResultLabel>
                  <p className="text-2xl font-bold text-amber-600">
                    {selectedResult.score_percentage}%
                  </p>
                  <p className="text-sm">
                    {selectedResult.correct_answers} / {selectedResult.total_questions} correct
                  </p>
                </div>
                <div>
                  <ResultLabel className="text-sm text-slate-500">Status</ResultLabel>
                  <div className="mt-1">
                    {selectedResult.passed ? (
                      <Badge variant="success">Passed</Badge>
                    ) : (
                      <Badge variant="destructive">Failed</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <ResultLabel className="text-sm text-slate-500">Time Taken</ResultLabel>
                  <p className="font-medium">{formatDuration(selectedResult.time_taken)}</p>
                </div>
                <div>
                  <ResultLabel className="text-sm text-slate-500">Violations</ResultLabel>
                  <p className="font-medium">{selectedResult.violations_count || 0}</p>
                </div>
              </div>

              {selectedResult.violations_count > 0 && selectedResult.violations && (
                <div>
                  <ResultLabel className="text-sm font-semibold">Violation Log</ResultLabel>
                  <div className="mt-2 space-y-2">
                    {selectedResult.violations.map((violation, idx) => (
                      <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="font-medium">{violation.type}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-600">
                            {formatDateTime(violation.timestamp)}
                          </span>
                        </div>
                        {violation.description && (
                          <p className="text-sm text-slate-600 mt-1 ml-6">
                            {violation.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function ResultLabel({ children, className = '' }) {
  return <div className={`text-sm font-medium ${className}`}>{children}</div>;
}

