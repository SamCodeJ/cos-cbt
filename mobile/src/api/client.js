import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ PRODUCTION - Online Backend
// export const SERVER_URL = 'https://api.uiges.shop';
// export const API_BASE_URL = `${SERVER_URL}/api`;

// 🔧 DEVELOPMENT - Local Testing (uncomment for local dev)
export const SERVER_URL = 'http://172.28.232.146:3001';
export const API_BASE_URL = `${SERVER_URL}/api`;

// Log API configuration on startup
console.log('📱 UI-GES Mobile App - API Configuration');
console.log('🔗 API Base URL:', API_BASE_URL);
console.log('🌐 Environment:', SERVER_URL.includes('https') ? 'PRODUCTION' : 'DEVELOPMENT');
console.log('---');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Increased to 30 seconds for production (internet may be slower than local)
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Token attached to request');
    } else {
      console.warn('⚠️ No token found in AsyncStorage');
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
      console.error('🔍 Check your internet connection');
      console.error('🔍 Backend URL:', API_BASE_URL);
    } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('❌ Network Error - Cannot reach server');
      console.error('🔍 Current API URL:', API_BASE_URL);
      console.error('💡 Troubleshooting:');
      console.error('   1. Check your internet connection');
      console.error('   2. Verify the backend is online: https://api.uiges.shop/health');
      console.error('   3. Check if you have mobile data or WiFi enabled');
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
let isTestingConnection = false;
let lastTestTime = 0;
const TEST_COOLDOWN = 2000; // 2 seconds cooldown between tests

export const testConnection = async (retries = 2) => {
  // Prevent multiple simultaneous tests
  const now = Date.now();
  if (isTestingConnection || (now - lastTestTime < TEST_COOLDOWN)) {
    return { success: false, message: 'Connection test in progress or too soon' };
  }
  
  isTestingConnection = true;
  lastTestTime = now;
  
  try {
    console.log('🏥 Testing backend connection...');
    console.log('📡 Target:', API_BASE_URL);
    
    const healthUrl = `${SERVER_URL}/health`;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`🔄 Retry attempt ${attempt}/${retries}...`);
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        const response = await axios.get(healthUrl, {
          timeout: 15000
        });
        console.log('✅ Backend is reachable');
        isTestingConnection = false;
        return { success: true, message: 'Backend is reachable' };
      } catch (error) {
        if (attempt === retries) {
          console.error('❌ Backend is NOT reachable');
          console.error('💡 Error:', error.message);
          console.error('🌐 Attempted URL:', healthUrl);
          console.error('');
          console.error('═══════════════════════════════════════');
          console.error('🔧 TROUBLESHOOTING:');
          console.error('═══════════════════════════════════════');
          console.error('1. ✅ Check your internet connection');
          console.error('2. 🌐 Verify backend is online');
          console.error('3. 📱 Try opening https://api.uiges.shop/health in browser');
          console.error('4. 🔄 Restart the mobile app');
          console.error('═══════════════════════════════════════');
          
          isTestingConnection = false;
          return { 
            success: false, 
            message: 'Cannot reach backend', 
            error: error.message,
            errorCode: error.code,
            attemptedUrl: healthUrl,
            troubleshooting: [
              'Check your internet connection',
              'Verify backend is online at https://api.uiges.shop/health',
              'Try restarting the app',
              'Contact support if issue persists'
            ]
          };
        }
      }
    }
  } catch (error) {
    isTestingConnection = false;
    throw error;
  }
};

export const candidateAPI = {
  login: async (studentId, password) => {
    console.log('🔐 Attempting login for student ID:', studentId);
    console.log('📡 Connecting to:', API_BASE_URL + '/candidate/auth/login');
    
    try {
      // Clear any old tokens before login
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('candidate');
      console.log('🧹 Cleared old credentials');
      
      const response = await apiClient.post('/candidate/auth/login', { 
        student_id: studentId, 
        password 
      });
      console.log('✅ Login successful');
      
      if (response.data.token) {
        await AsyncStorage.setItem('auth_token', response.data.token);
        console.log('🔑 Token stored successfully');
        
        // Store user data
        const userData = response.data.candidate || response.data.user;
        await AsyncStorage.setItem('candidate', JSON.stringify(userData));
        console.log('💾 Stored user data for:', userData.name);
        
        // Verify token was stored
        const verifyToken = await AsyncStorage.getItem('auth_token');
        if (verifyToken) {
          console.log('✅ Token verification successful');
        } else {
          console.error('❌ Token not found after storage!');
        }
        
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
  
  getTimeRemaining: async (examId) => {
    const response = await apiClient.get(`/candidate/exams/${examId}/time-remaining`);
    return response.data;
  },

  verifyPin: async (examId, pin) => {
    const response = await apiClient.post(`/candidate/exams/${examId}/verify-pin`, { pin });
    return response.data;
  }
};

export default apiClient;