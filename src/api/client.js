import axios from 'axios';

// Configure base URL - uses Vite proxy in development, or environment variable in production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      // Only redirect if we're not already on the login page
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  },
  
  me: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await apiClient.put('/auth/profile', data);
    // Update stored user data
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await apiClient.put('/auth/password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  uploadProfilePicture: async (file) => {
    const formData = new FormData();
    formData.append('profile_picture', file);
    
    const response = await apiClient.post('/auth/upload-profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // Update stored user data
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  deleteProfilePicture: async () => {
    const response = await apiClient.delete('/auth/profile-picture');
    
    // Update stored user data
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },
};

// Exam API
export const examAPI = {
  list: async (filters = {}) => {
    const response = await apiClient.get('/exams', { params: filters });
    return response.data;
  },
  
  get: async (id) => {
    const response = await apiClient.get(`/exams/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await apiClient.post('/exams', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await apiClient.put(`/exams/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await apiClient.delete(`/exams/${id}`);
    return response.data;
  },
  
  duplicate: async (id) => {
    const response = await apiClient.post(`/exams/${id}/duplicate`);
    return response.data;
  },
  
  getCandidates: async (examId) => {
    const response = await apiClient.get(`/exams/${examId}/candidates`);
    return response.data;
  },
  
  addCandidates: async (examId, candidates) => {
    const response = await apiClient.post(`/exams/${examId}/candidates`, { candidates });
    return response.data;
  },

  removeCandidate: async (examId, candidateId) => {
    const response = await apiClient.delete(`/exams/${examId}/candidates/${candidateId}`);
    return response.data;
  },
  
  getQuestions: async (examId) => {
    const response = await apiClient.get(`/exams/${examId}/questions`);
    return response.data;
  },
  
  addQuestions: async (examId, questions, replace = false) => {
    const response = await apiClient.post(`/exams/${examId}/questions`, { questions, replace });
    return response.data;
  },
};

// Question Bank API
export const questionBankAPI = {
  list: async (filters = {}) => {
    const response = await apiClient.get('/question-bank', { params: filters });
    return response.data;
  },
  
  get: async (id) => {
    const response = await apiClient.get(`/question-bank/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await apiClient.post('/question-bank', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await apiClient.put(`/question-bank/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await apiClient.delete(`/question-bank/${id}`);
    return response.data;
  },
  
  bulkImport: async (questions) => {
    const response = await apiClient.post('/question-bank/bulk-import', { questions });
    return response.data;
  },
};

// Results API
export const resultsAPI = {
  list: async (filters = {}) => {
    const response = await apiClient.get('/results', { params: filters });
    return response.data;
  },
  
  get: async (id) => {
    const response = await apiClient.get(`/results/${id}`);
    return response.data;
  },
  
  getByExam: async (examId) => {
    const response = await apiClient.get(`/results/exam/${examId}`);
    return response.data;
  },
  
  getTranscript: async (resultId) => {
    const response = await apiClient.get(`/results/${resultId}/transcript`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

// Teacher API (Admin only)
export const teacherAPI = {
  list: async () => {
    const response = await apiClient.get('/teachers');
    return response.data;
  },
  
  get: async (id) => {
    const response = await apiClient.get(`/teachers/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await apiClient.post('/teachers', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await apiClient.put(`/teachers/${id}`, data);
    return response.data;
  },
  
  deactivate: async (id) => {
    const response = await apiClient.post(`/teachers/${id}/deactivate`);
    return response.data;
  },

  getAllCandidates: async () => {
    const response = await apiClient.get('/teachers/candidates/all');
    return response.data;
  },

  updateCandidate: async (id, data) => {
    const response = await apiClient.put(`/teachers/candidates/${id}`, data);
    return response.data;
  },

  toggleCandidateStatus: async (id) => {
    const response = await apiClient.post(`/teachers/candidates/${id}/toggle-status`);
    return response.data;
  },
};

// Audit Logs API (Admin only)
export const auditAPI = {
  list: async (filters = {}) => {
    const response = await apiClient.get('/audit-logs', { params: filters });
    return response.data;
  },
};

// Candidate Mobile API
export const candidateAPI = {
  login: async (email, password) => {
    const response = await apiClient.post('/candidate/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('candidate', JSON.stringify(response.data.candidate));
    }
    return response.data;
  },
  
  getExams: async () => {
    const response = await apiClient.get('/candidate/exams');
    return response.data;
  },
  
  getExam: async (examId) => {
    const response = await apiClient.get(`/candidate/exams/${examId}`);
    return response.data;
  },
  
  startExam: async (examId) => {
    const response = await apiClient.post(`/candidate/exams/${examId}/start`);
    return response.data;
  },
  
  saveAnswer: async (examId, questionId, answer) => {
    const response = await apiClient.post(`/candidate/exams/${examId}/save-answer`, {
      question_id: questionId,
      answer,
    });
    return response.data;
  },
  
  submitExam: async (examId, answers, violations) => {
    const response = await apiClient.post(`/candidate/exams/${examId}/submit`, {
      answers,
      violations,
    });
    return response.data;
  },
  
  getResult: async (examId) => {
    const response = await apiClient.get(`/candidate/exams/${examId}/result`);
    return response.data;
  },
};

export default apiClient;

