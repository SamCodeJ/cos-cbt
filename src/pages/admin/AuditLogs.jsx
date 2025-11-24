import React, { useState, useEffect } from 'react';
import { auditAPI } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [searchQuery, logs]);

  useEffect(() => {
    // Reset to page 1 when search changes
    setCurrentPage(1);
  }, [searchQuery]);

  const loadLogs = async () => {
    try {
      const data = await auditAPI.list();
      // Backend returns { logs: [...], total, limit, offset }
      setLogs(data.logs || data);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    if (searchQuery) {
      filtered = filtered.filter(log =>
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  };

  // Pagination helpers
  const getPaginatedLogs = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredLogs.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(filteredLogs.length / itemsPerPage);
  };

  const handleItemsPerPageChange = (newPerPage) => {
    setItemsPerPage(newPerPage);
    setCurrentPage(1); // Reset to first page
  };

  const paginatedLogs = getPaginatedLogs();
  const totalPages = getTotalPages();

  const getActionBadge = (action) => {
    if (action.includes('create')) return <Badge className="bg-green-500">Create</Badge>;
    if (action.includes('update')) return <Badge className="bg-blue-500">Update</Badge>;
    if (action.includes('delete')) return <Badge variant="destructive">Delete</Badge>;
    return <Badge variant="outline">{action}</Badge>;
  };

  // Pagination Component
  const Pagination = () => {
    const totalItems = filteredLogs.length;
    
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
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-600">
            Showing {startItem} to {endItem} of {totalItems} logs
          </div>
          
          {/* Length Menu */}
          <div className="flex items-center gap-2">
            <Label htmlFor="logs-per-page" className="text-sm text-slate-600">
              Show:
            </Label>
            <select
              id="logs-per-page"
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
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
            onClick={() => setCurrentPage(currentPage - 1)}
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
                onClick={() => setCurrentPage(1)}
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
              onClick={() => setCurrentPage(page)}
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
                onClick={() => setCurrentPage(totalPages)}
              >
                {totalPages}
              </Button>
            </>
          )}
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Audit Logs</h1>
          <p className="text-slate-600">Track all system activities and changes</p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredLogs.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">S/N</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLogs.map((log, index) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium text-slate-600">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </TableCell>
                        <TableCell>{getActionBadge(log.action)}</TableCell>
                        <TableCell className="font-medium">{log.user_name}</TableCell>
                        <TableCell className="max-w-md truncate">{log.details}</TableCell>
                        <TableCell className="text-sm text-slate-600">{log.ip_address}</TableCell>
                        <TableCell className="text-sm">{formatDateTime(log.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Pagination />
              </>
            ) : (
              <div className="text-center py-16">
                <ClipboardList className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">No audit logs found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

