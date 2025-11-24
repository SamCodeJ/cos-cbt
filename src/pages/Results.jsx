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
import { BarChart3, Download, Search, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
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

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterResults();
  }, [selectedExam, searchQuery, results]);

  const loadData = async () => {
    try {
      const [resultsData, examsData] = await Promise.all([
        resultsAPI.list(),
        examAPI.list(),
      ]);
      setResults(resultsData);
      setExams(examsData);
    } catch (error) {
      toast.error('Failed to load results');
    } finally {
      setIsLoading(false);
    }
  };

  const filterResults = () => {
    let filtered = [...results];

    if (selectedExam !== 'all') {
      filtered = filtered.filter(r => r.exam_id === selectedExam);
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
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredResults.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
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
                    {filteredResults.map((result) => (
                      <TableRow key={result.id} className="hover:bg-slate-50">
                        <TableCell>
                          <div>
                            <div className="font-medium">{result.candidate_name}</div>
                            <div className="text-sm text-slate-500">{result.candidate_email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {exams.find(e => e.id === result.exam_id)?.title || 'N/A'}
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
            ) : (
              <div className="text-center py-16">
                <BarChart3 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">
                  {searchQuery || selectedExam !== 'all' ? 'No results found' : 'No results yet'}
                </h3>
                <p className="text-slate-500">
                  {searchQuery || selectedExam !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : 'Results will appear here once candidates complete their exams'}
                </p>
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
                  <Label className="text-sm text-slate-500">Candidate</Label>
                  <p className="font-medium">{selectedResult.candidate_name}</p>
                  <p className="text-sm text-slate-500">{selectedResult.candidate_email}</p>
                </div>
                <div>
                  <Label className="text-sm text-slate-500">Exam</Label>
                  <p className="font-medium">
                    {exams.find(e => e.id === selectedResult.exam_id)?.title}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-slate-500">Score</Label>
                  <p className="text-2xl font-bold text-amber-600">
                    {selectedResult.score_percentage}%
                  </p>
                  <p className="text-sm">
                    {selectedResult.correct_answers} / {selectedResult.total_questions} correct
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-slate-500">Status</Label>
                  <div className="mt-1">
                    {selectedResult.passed ? (
                      <Badge variant="success">Passed</Badge>
                    ) : (
                      <Badge variant="destructive">Failed</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-slate-500">Time Taken</Label>
                  <p className="font-medium">{formatDuration(selectedResult.time_taken)}</p>
                </div>
                <div>
                  <Label className="text-sm text-slate-500">Violations</Label>
                  <p className="font-medium">{selectedResult.violations_count || 0}</p>
                </div>
              </div>

              {selectedResult.violations_count > 0 && selectedResult.violations && (
                <div>
                  <Label className="text-sm font-semibold">Violation Log</Label>
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

function Label({ children, className = '' }) {
  return <div className={`text-sm font-medium ${className}`}>{children}</div>;
}

