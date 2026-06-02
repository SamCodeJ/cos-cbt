import axios from 'axios';

// Get API base URL from environment variable or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

console.log('🖥️  C-COS Desktop Candidate Portal');
console.log('🔗 API Base URL:', API_BASE_URL);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 second timeout to allow for large uploads
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('candidate_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('candidate_auth_token');
      localStorage.removeItem('candidate_data');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const candidateAPI = {
  // Authentication
  login: async (studentId, password) => {
    const response = await apiClient.post('/candidate/auth/login', {
      student_id: studentId,
      password,
    });
    
    if (response.data.token) {
      localStorage.setItem('candidate_auth_token', response.data.token);
      localStorage.setItem('candidate_data', JSON.stringify(response.data.candidate));
    }
    
    return response.data;
  },

  // Get assigned exams
  getExams: async () => {
    const response = await apiClient.get('/candidate/exams');
    return response.data;
  },

  // Get specific exam details
  getExam: async (examId) => {
    const response = await apiClient.get(`/candidate/exams/${examId}`);
    return response.data;
  },

  // Start exam (get questions)
  startExam: async (examId) => {
    const response = await apiClient.post(`/candidate/exams/${examId}/start`);
    return response.data;
  },

  // Save single answer
  saveAnswer: async (examId, questionId, answer) => {
    const response = await apiClient.post(`/candidate/exams/${examId}/save-answer`, {
      question_id: questionId,
      answer,
    });
    return response.data;
  },

  // Submit exam
  submitExam: async (examId, answers, violations = []) => {
    const response = await apiClient.post(`/candidate/exams/${examId}/submit`, {
      answers,
      violations,
    });
    return response.data;
  },

  // Get exam result
  getResult: async (examId) => {
    const response = await apiClient.get(`/candidate/exams/${examId}/result`);
    return response.data;
  },

  // Get time remaining (for time extensions)
  getTimeRemaining: async (examId) => {
    const response = await apiClient.get(`/candidate/exams/${examId}/time-remaining`);
    return response.data;
  },
};

export default apiClient;
