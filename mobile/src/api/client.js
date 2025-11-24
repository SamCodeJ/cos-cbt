import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://10.57.236.125:3000/api'; // Use computer's IP for physical device

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('candidate');
    }
    return Promise.reject(error);
  }
);

export const candidateAPI = {
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    if (response.data.token) {
      await AsyncStorage.setItem('auth_token', response.data.token);
      // Store user data - could be candidate, teacher, or admin
      const userData = response.data.candidate || response.data.user;
      await AsyncStorage.setItem('candidate', JSON.stringify(userData));
      // Normalize response format for mobile app
      return {
        token: response.data.token,
        candidate: userData
      };
    }
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await apiClient.put('/auth/profile', data);
    if (response.data) {
      await AsyncStorage.setItem('candidate', JSON.stringify(response.data));
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

  uploadProfilePicture: async (uri) => {
    const formData = new FormData();
    const filename = uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('profile_picture', {
      uri,
      name: filename,
      type,
    });

    const response = await apiClient.post('/auth/upload-profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.user) {
      await AsyncStorage.setItem('candidate', JSON.stringify(response.data.user));
    }

    return response.data;
  },

  deleteProfilePicture: async () => {
    const response = await apiClient.delete('/auth/profile-picture');

    if (response.data.user) {
      await AsyncStorage.setItem('candidate', JSON.stringify(response.data.user));
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

