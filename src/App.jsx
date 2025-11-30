import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import './index.css';

// Eager load only critical routes
import Login from '@/pages/Login';
import Layout from '@/pages/Layout';

// Lazy load all other pages
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const MyExams = lazy(() => import('@/pages/MyExams'));
const CreateExam = lazy(() => import('@/pages/CreateExam'));
const QuestionBank = lazy(() => import('@/pages/QuestionBank'));
const Results = lazy(() => import('@/pages/Results'));
const Candidates = lazy(() => import('@/pages/Candidates'));
const Settings = lazy(() => import('@/pages/Settings'));

// Lazy load admin pages
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const ManageTeachers = lazy(() => import('@/pages/admin/ManageTeachers'));
const AuditLogs = lazy(() => import('@/pages/admin/AuditLogs'));

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-slate-600 text-sm">Loading...</p>
      </div>
    </div>
  );
}

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
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={
              <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
            } />
            <Route path="my-exams" element={
              <Suspense fallback={<PageLoader />}>
                <MyExams />
              </Suspense>
            } />
            <Route path="create-exam" element={
              <Suspense fallback={<PageLoader />}>
                <CreateExam />
              </Suspense>
            } />
            <Route path="edit-exam/:id" element={
              <Suspense fallback={<PageLoader />}>
                <CreateExam />
              </Suspense>
            } />
            <Route path="question-bank" element={
              <Suspense fallback={<PageLoader />}>
                <QuestionBank />
              </Suspense>
            } />
            <Route path="results" element={
              <Suspense fallback={<PageLoader />}>
                <Results />
              </Suspense>
            } />
            <Route path="candidates" element={
              <Suspense fallback={<PageLoader />}>
                <Candidates />
              </Suspense>
            } />
            <Route path="settings" element={
              <Suspense fallback={<PageLoader />}>
                <Settings />
              </Suspense>
            } />
            
            {/* Admin Routes */}
            <Route path="admin" element={
              <ProtectedRoute adminOnly>
                <Suspense fallback={<PageLoader />}>
                  <AdminDashboard />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="admin/teachers" element={
              <ProtectedRoute adminOnly>
                <Suspense fallback={<PageLoader />}>
                  <ManageTeachers />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="admin/audit-logs" element={
              <ProtectedRoute adminOnly>
                <Suspense fallback={<PageLoader />}>
                  <AuditLogs />
                </Suspense>
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

