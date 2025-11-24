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
import { Users, Search, Loader2, Mail, Calendar, FileText, CheckCircle2, XCircle, Edit, MoreVertical, Key, Power } from 'lucide-react';
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
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
                    {filteredCandidates.map((candidate) => (
                      <TableRow key={candidate.id} className="hover:bg-slate-50">
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
              <Input
                id="edit-password"
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                placeholder="Leave blank to keep current password"
              />
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

