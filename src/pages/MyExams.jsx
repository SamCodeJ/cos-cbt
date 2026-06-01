import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { examAPI } from '@/api/client';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle, MoreHorizontal, Edit, Copy, Trash2, Search, FileText, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate, formatDuration } from '@/lib/utils';
import TimeExtensionModal from '@/components/TimeExtensionModal';

export default function MyExams() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [timeExtensionModalOpen, setTimeExtensionModalOpen] = useState(false);
  const [selectedExamForTime, setSelectedExamForTime] = useState(null);

  useEffect(() => {
    loadExams();
  }, []);

  useEffect(() => {
    filterExams();
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, statusFilter, exams]);

  const loadExams = async () => {
    try {
      const data = await examAPI.list();
      setExams(data);
      setFilteredExams(data);
    } catch (error) {
      toast.error('Failed to load exams');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterExams = () => {
    let filtered = [...exams];

    if (searchQuery) {
      filtered = filtered.filter(exam =>
        exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.subject?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(exam => exam.status === statusFilter);
    }

    setFilteredExams(filtered);
  };

  const handleDuplicate = async (examId) => {
    try {
      await examAPI.duplicate(examId);
      toast.success('Exam duplicated successfully');
      loadExams();
    } catch (error) {
      toast.error('Failed to duplicate exam');
    }
  };

  const handleDelete = async () => {
    if (!examToDelete) return;

    try {
      await examAPI.delete(examToDelete.id);
      toast.success('Exam deleted successfully');
      setExams(exams.filter(e => e.id !== examToDelete.id));
      setDeleteDialogOpen(false);
      setExamToDelete(null);
    } catch (error) {
      toast.error('Failed to delete exam');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500">Scheduled</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
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
  const paginatedExams = getPaginatedItems(filteredExams, currentPage, itemsPerPage);
  const totalPages = getTotalPages(filteredExams, itemsPerPage);

  // Pagination component
  const Pagination = ({ currentPage, totalPages, onPageChange, itemsPerPage, onItemsPerPageChange }) => {
    const totalItems = filteredExams.length;
    
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
            Showing {startItem} to {endItem} of {totalItems} exams
          </div>
          
          {/* Length Menu */}
          <div className="flex items-center gap-2">
            <Label htmlFor="exams-per-page" className="text-sm text-slate-600">
              Show:
            </Label>
            <select
              id="exams-per-page"
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
            <h1 className="text-3xl font-bold text-slate-900 mb-2">My Exams</h1>
            <p className="text-slate-600">Manage and monitor all your examinations</p>
          </div>
          <Link to="/create-exam">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white">
              <PlusCircle className="w-5 h-5 mr-2" />
              Create Exam
            </Button>
          </Link>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b border-slate-200">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <CardTitle className="text-xl font-bold">All Exams</CardTitle>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search exams..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredExams.length > 0 ? (
              <>
                {/* Mobile Card View */}
                <div className="md:hidden p-4 space-y-4">
                  {paginatedExams.map((exam) => (
                    <div key={exam.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 text-base mb-1 truncate">{exam.title}</h3>
                          <p className="text-sm text-slate-600">{exam.subject}</p>
                        </div>
                        <div className="flex-shrink-0">
                          {getStatusBadge(exam.status)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-slate-500">Questions:</span>
                          <span className="ml-2 font-medium text-slate-900">
                            {exam.questions_per_candidate} / {exam.total_questions || exam.questions_per_candidate}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Candidates:</span>
                          <span className="ml-2 font-medium text-slate-900">{exam.candidate_count || 0}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Duration:</span>
                          <span className="ml-2 font-medium text-slate-900">{formatDuration(exam.duration)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Start:</span>
                          <span className="ml-2 font-medium text-slate-900">{formatDate(exam.start_date)}</span>
                        </div>
                        {exam.require_pin_check && (
                          <div className="col-span-2 bg-amber-50 p-2 rounded border border-amber-100 mt-1 flex justify-between items-center">
                            <span className="text-amber-800 text-xs font-semibold">📍 PIN Check Enabled</span>
                            <span className="font-mono font-bold text-amber-900 bg-amber-200 px-2 py-0.5 rounded">{exam.exam_pin}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-slate-200">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/edit-exam/${exam.id}`)}
                          className="flex-1"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {(exam.status === 'active' || exam.status === 'scheduled') && (
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedExamForTime(exam);
                                  setTimeExtensionModalOpen(true);
                                }}
                              >
                                <Clock className="w-4 h-4 mr-2" />
                                Extend Time
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleDuplicate(exam.id)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/results?exam=${exam.id}`)}>
                              <FileText className="w-4 h-4 mr-2" />
                              View Results
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setExamToDelete(exam);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">S/N</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Questions</TableHead>
                        <TableHead>Candidates</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead className="text-center">PIN</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedExams.map((exam, index) => (
                        <TableRow key={exam.id} className="hover:bg-slate-50">
                          <TableCell className="text-slate-500">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </TableCell>
                          <TableCell className="font-medium">{exam.title}</TableCell>
                          <TableCell>{exam.subject}</TableCell>
                          <TableCell>
                            {exam.questions_per_candidate} / {exam.total_questions || exam.questions_per_candidate}
                          </TableCell>
                          <TableCell>{exam.candidate_count || 0}</TableCell>
                          <TableCell>{formatDuration(exam.duration)}</TableCell>
                          <TableCell>{getStatusBadge(exam.status)}</TableCell>
                          <TableCell>{formatDate(exam.start_date)}</TableCell>
                          <TableCell className="text-center">
                            {exam.require_pin_check ? (
                              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200" title="PIN Check Enabled">
                                {exam.exam_pin}
                              </Badge>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/edit-exam/${exam.id}`)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                {(exam.status === 'active' || exam.status === 'scheduled') && (
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setSelectedExamForTime(exam);
                                      setTimeExtensionModalOpen(true);
                                    }}
                                  >
                                    <Clock className="w-4 h-4 mr-2" />
                                    Extend Time
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleDuplicate(exam.id)}>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/results?exam=${exam.id}`)}>
                                  <FileText className="w-4 h-4 mr-2" />
                                  View Results
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setExamToDelete(exam);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
                <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">
                  {searchQuery || statusFilter !== 'all' ? 'No exams found' : 'No exams created yet'}
                </h3>
                <p className="text-slate-500 mb-6">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Create your first exam to get started'}
                </p>
                {!searchQuery && statusFilter === 'all' && (
                  <Link to="/create-exam">
                    <Button className="bg-amber-600 hover:bg-amber-700">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Create First Exam
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Exam</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{examToDelete?.title}"? This action cannot be undone.
              All related data including results will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Time Extension Modal */}
      <TimeExtensionModal
        open={timeExtensionModalOpen}
        onOpenChange={setTimeExtensionModalOpen}
        examId={selectedExamForTime?.id}
        examTitle={selectedExamForTime?.title}
        onSuccess={() => {
          loadExams(); // Refresh exam list after time extension
        }}
      />
    </div>
  );
}

