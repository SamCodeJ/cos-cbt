import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://10.34.232.125:3000/api'; // Use computer's IP for physical device

// Log API configuration on startup
console.log('📱 UI-GES Mobile App - API Configuration');
console.log('🔗 API Base URL:', API_BASE_URL);
console.log('📍 Server IP:', API_BASE_URL.split('/')[2].split(':')[0]);
console.log('🔌 Server Port:', API_BASE_URL.split(':')[2]?.split('/')[0]);
console.log('---');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
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
    // Enhanced error logging
    if (error.code === 'ECONNABORTED') {
      console.error('❌ Connection timeout - Server took too long to respond');
      console.error('🔍 Check if backend server is running on:', API_BASE_URL);
    } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('❌ Network Error - Cannot reach server');
      console.error('🔍 Current API URL:', API_BASE_URL);
      console.error('💡 Troubleshooting:');
      console.error('   1. Check if backend server is running');
      console.error('   2. Verify computer IP address hasn\'t changed');
      console.error('   3. Ensure phone and computer are on same WiFi network');
      console.error('   4. Check backend terminal for correct IP address');
    } else if (error.response?.status === 401) {
      console.log('🔐 Authentication failed - clearing stored credentials');
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('candidate');
    } else if (error.response?.status) {
      console.error(`❌ Server Error ${error.response.status}:`, error.response.data?.error || error.message);
    }
    
    return Promise.reject(error);
  }
);

// Health check function to test backend connectivity
export const testConnection = async () => {
  console.log('🏥 Testing backend connection...');
  console.log('📡 Target:', API_BASE_URL);
  
  try {
    const response = await axios.get(API_BASE_URL.replace('/api', '/health'), {
      timeout: 5000
    });
    console.log('✅ Backend is reachable');
    return { success: true, message: 'Backend is reachable' };
  } catch (error) {
    console.error('❌ Backend is NOT reachable');
    console.error('💡 Error:', error.message);
    
    let troubleshooting = [];
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      troubleshooting = [
        'Server is taking too long to respond',
        'Check if backend server is running',
        'Try restarting the backend server'
      ];
    } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      troubleshooting = [
        'Cannot reach server at ' + API_BASE_URL,
        'Check if backend is running (should show "🚀 Backend running on port...")',
        'Verify your computer\'s IP address hasn\'t changed',
        'Ensure phone and computer are on the same WiFi network',
        'Update API_BASE_URL in mobile/src/api/client.js if needed'
      ];
    }
    
    return { 
      success: false, 
      message: 'Cannot reach backend', 
      troubleshooting 
    };
  }
};

export const candidateAPI = {
  login: async (email, password) => {
    console.log('🔐 Attempting login for:', email);
    console.log('📡 Connecting to:', API_BASE_URL + '/auth/login');
    
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      console.log('✅ Login successful');
      
      if (response.data.token) {
        await AsyncStorage.setItem('auth_token', response.data.token);
        // Store user data - could be candidate, teacher, or admin
        const userData = response.data.candidate || response.data.user;
        await AsyncStorage.setItem('candidate', JSON.stringify(userData));
        console.log('💾 Stored user data for:', userData.name);
        
        // Normalize response format for mobile app
        return {
          token: response.data.token,
          candidate: userData
        };
      }
      return response.data;
    } catch (error) {
      console.error('❌ Login failed');
      throw error;
    }
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

