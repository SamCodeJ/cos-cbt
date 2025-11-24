import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Layout from '@/pages/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import MyExams from '@/pages/MyExams';
import CreateExam from '@/pages/CreateExam';
import QuestionBank from '@/pages/QuestionBank';
import Results from '@/pages/Results';
import Candidates from '@/pages/Candidates';
import Settings from '@/pages/Settings';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import ManageTeachers from '@/pages/admin/ManageTeachers';
import AuditLogs from '@/pages/admin/AuditLogs';
import './index.css';

function ProtectedRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem('auth_token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="my-exams" element={<MyExams />} />
          <Route path="create-exam" element={<CreateExam />} />
          <Route path="edit-exam/:id" element={<CreateExam />} />
          <Route path="question-bank" element={<QuestionBank />} />
          <Route path="results" element={<Results />} />
          <Route path="candidates" element={<Candidates />} />
          <Route path="settings" element={<Settings />} />
          
          {/* Admin Routes */}
          <Route path="admin" element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="admin/teachers" element={
            <ProtectedRoute adminOnly>
              <ManageTeachers />
            </ProtectedRoute>
          } />
          <Route path="admin/audit-logs" element={
            <ProtectedRoute adminOnly>
              <AuditLogs />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

