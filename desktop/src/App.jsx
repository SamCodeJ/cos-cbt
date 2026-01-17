import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import ExamInstructions from '@/pages/ExamInstructions';
import ExamScreen from '@/pages/ExamScreen';
import ResultScreen from '@/pages/ResultScreen';
import './index.css';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('candidate_auth_token');
  
  if (!token) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exam-instructions/:examId"
          element={
            <ProtectedRoute>
              <ExamInstructions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exam/:examId"
          element={
            <ProtectedRoute>
              <ExamScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/result/:examId"
          element={
            <ProtectedRoute>
              <ResultScreen />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
