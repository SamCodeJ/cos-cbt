import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, Search, Loader2, Mail, Calendar, FileText, CheckCircle2, XCircle, Edit, MoreVertical, Key, Power, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { teacherAPI } from '@/api/client';
import { toast } from 'sonner';

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    student_id: '',
    password: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    setIsLoading(true);
    try {
      const data = await teacherAPI.getAllCandidates();
      setCandidates(data);
    } catch (error) {
      console.error('Error loading candidates:', error);
      toast.error('Failed to load candidates');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCandidates = candidates.filter(candidate => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      candidate.name?.toLowerCase().includes(query) ||
      candidate.email?.toLowerCase().includes(query) ||
      candidate.student_id?.toLowerCase().includes(query)
    );
  });

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
  const paginatedCandidates = getPaginatedItems(filteredCandidates, currentPage, itemsPerPage);
  const totalPages = getTotalPages(filteredCandidates, itemsPerPage);

  // Pagination component
  const Pagination = ({ currentPage, totalPages, onPageChange, itemsPerPage, onItemsPerPageChange }) => {
    const totalItems = filteredCandidates.length;
    
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
            Showing {startItem} to {endItem} of {totalItems} candidates
          </div>
          
          {/* Length Menu */}
          <div className="flex items-center gap-2">
            <Label htmlFor="candidates-per-page" className="text-sm text-slate-600">
              Show:
            </Label>
            <select
              id="candidates-per-page"
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

  const handleEditClick = (candidate) => {
    setSelectedCandidate(candidate);
    setEditForm({
      name: candidate.name,
      email: candidate.email,
      student_id: candidate.student_id || '',
      password: '',
    });
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editForm.name || !editForm.email) {
      toast.error('Name and email are required');
      return;
    }

    setIsSaving(true);
    try {
      const updateData = {
        name: editForm.name,
        email: editForm.email,
        student_id: editForm.student_id,
      };

      // Only include password if it was provided
      if (editForm.password) {
        updateData.password = editForm.password;
      }

      await teacherAPI.updateCandidate(selectedCandidate.id, updateData);
      
      toast.success(editForm.password 
        ? 'Candidate updated successfully with new password' 
        : 'Candidate updated successfully'
      );
      
      setEditDialogOpen(false);
      loadCandidates();
    } catch (error) {
      console.error('Error updating candidate:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update candidate';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (candidate) => {
    try {
      const response = await teacherAPI.toggleCandidateStatus(candidate.id);
      toast.success(`Candidate ${response.is_active ? 'activated' : 'deactivated'} successfully`);
      loadCandidates();
    } catch (error) {
      console.error('Error toggling candidate status:', error);
      toast.error('Failed to update candidate status');
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-64"></div>
            <div className="h-96 bg-slate-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Candidates</h1>
          <p className="text-slate-600">View and manage all candidates across exams</p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                All Candidates
                <Badge variant="secondary">{candidates.length}</Badge>
              </CardTitle>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, email, or student ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredCandidates.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 mb-2">
                  {searchQuery ? 'No candidates found matching your search' : 'No candidates yet'}
                </p>
                {!searchQuery && (
                  <p className="text-sm text-slate-400">
                    Candidates are added when you create exams and assign them to students.
                  </p>
                )}
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {paginatedCandidates.map((candidate) => (
                    <div key={candidate.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 text-base mb-1">{candidate.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{candidate.email}</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {candidate.is_active ? (
                            <Badge variant="success" className="gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <XCircle className="w-3 h-3" />
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-slate-500">Student ID:</span>
                          <div className="mt-1">
                            <Badge variant="outline">{candidate.student_id || 'N/A'}</Badge>
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500">Exams:</span>
                          <div className="mt-1 flex items-center gap-1">
                            <FileText className="w-4 h-4 text-slate-400" />
                            <span className="font-medium">{candidate.exam_count || 0}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500">Attempts:</span>
                          <div className="mt-1">
                            <span className="font-medium">{candidate.attempts_count || 0}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500">Registered:</span>
                          <div className="mt-1 flex items-center gap-1 text-xs">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(candidate.created_at)}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-slate-200">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditClick(candidate)}
                          className="flex-1"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleStatus(candidate)}
                          className="flex-1"
                        >
                          <Power className="w-4 h-4 mr-1" />
                          {candidate.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block rounded-lg border border-slate-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-16">S/N</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Student ID</TableHead>
                        <TableHead className="text-center">Exams</TableHead>
                        <TableHead className="text-center">Attempts</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead>Registered</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedCandidates.map((candidate, index) => (
                        <TableRow key={candidate.id} className="hover:bg-slate-50">
                          <TableCell className="text-slate-500">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </TableCell>
                          <TableCell className="font-medium">{candidate.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-slate-600">
                              <Mail className="w-3.5 h-3.5" />
                              {candidate.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{candidate.student_id || 'N/A'}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <FileText className="w-4 h-4 text-slate-400" />
                              <span className="font-medium">{candidate.exam_count || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-medium">{candidate.attempts_count || 0}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            {candidate.is_active ? (
                              <Badge variant="success" className="gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <XCircle className="w-3 h-3" />
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-slate-600">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(candidate.created_at)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditClick(candidate)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleStatus(candidate)}>
                                  <Power className="w-4 h-4 mr-2" />
                                  {candidate.is_active ? 'Deactivate' : 'Activate'}
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Candidate Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Candidate</DialogTitle>
            <DialogDescription>
              Update candidate information. Leave password blank to keep current password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Enter candidate name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-student-id">Student ID</Label>
              <Input
                id="edit-student-id"
                value={editForm.student_id}
                onChange={(e) => setEditForm({ ...editForm, student_id: e.target.value })}
                placeholder="Enter student ID (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                New Password (Optional)
              </Label>
              <div className="relative">
                <Input
                  id="edit-password"
                  type={showPassword ? 'text' : 'password'}
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Leave blank to keep current password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Only fill this if you want to reset the candidate's password
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

