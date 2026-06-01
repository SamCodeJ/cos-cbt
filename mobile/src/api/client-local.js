import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// IMPORTANT: Update this IP address to match your computer's current IP address
// Find your IP: Windows (ipconfig) or Mac/Linux (ifconfig)
// Default backend port is 3001, but check your backend terminal output for the actual port
// Current IP detected: 10.165.76.146 (update this if your IP changes)
// export const SERVER_URL = 'https://api.ccos.shop';
export const SERVER_URL = 'http://10.165.76.146:3001';
export const API_BASE_URL = `${SERVER_URL}/api`; // Use computer's IP for physical device
const API_BASE_URL_INTERNAL = API_BASE_URL; // Keep for backward compatibility

// Log API configuration on startup
console.log('📱 C-COS Mobile App - API Configuration');
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
      console.error('🔍 Check if backend server is running on:', API_BASE_URL);
    } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('❌ Network Error - Cannot reach server');
      console.error('🔍 Current API URL:', API_BASE_URL);
      console.error('🔍 Error Code:', error.code);
      console.error('💡 Troubleshooting:');
      console.error('   1. Check if backend server is running (look for "🚀 Backend running on port...")');
      console.error('   2. Verify computer IP address hasn\'t changed (check backend terminal output)');
      console.error('   3. Check PORT number - backend defaults to 3001, not 3000');
      console.error('   4. Ensure phone and computer are on same WiFi network');
      console.error('   5. Check Windows Firewall isn\'t blocking the port');
      console.error('   6. Try accessing the backend from phone browser: http://' + API_BASE_URL.split('/')[2] + '/health');
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

export const testConnection = async (retries = 1) => {
  // Prevent multiple simultaneous tests
  const now = Date.now();
  if (isTestingConnection || (now - lastTestTime < TEST_COOLDOWN)) {
    // Return cached result if testing recently
    return { success: false, message: 'Connection test in progress or too soon' };
  }
  
  isTestingConnection = true;
  lastTestTime = now;
  
  try {
    console.log('🏥 Testing backend connection...');
    console.log('📡 Target:', API_BASE_URL);
    
    const healthUrl = API_BASE_URL.replace('/api', '/health');
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`🔄 Retry attempt ${attempt}/${retries}...`);
          // Wait 1 second before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        const response = await axios.get(healthUrl, {
          timeout: 10000 // Match the main client timeout
        });
        console.log('✅ Backend is reachable');
        isTestingConnection = false;
        return { success: true, message: 'Backend is reachable' };
      } catch (error) {
        // Only log error on last attempt to reduce noise
        if (attempt === retries) {
          const serverIP = API_BASE_URL.split('/')[2].split(':')[0];
          const serverPort = API_BASE_URL.split(':')[2]?.split('/')[0] || '3001';
          
          console.error('❌ Backend is NOT reachable');
          console.error('💡 Error:', error.message);
          console.error('🔍 Error Code:', error.code);
          console.error('🌐 Attempted URL:', healthUrl);
          console.error('');
          console.error('═══════════════════════════════════════');
          console.error('🔧 TROUBLESHOOTING STEPS:');
          console.error('═══════════════════════════════════════');
          
          let troubleshooting = [];
          if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            console.error('⏱️  Connection timeout detected');
            console.error('');
            console.error('1. ✅ VERIFY BACKEND IS RUNNING:');
            console.error('   - Open backend terminal');
            console.error('   - Look for: "🚀 C-COS Backend Server running on port ' + serverPort + '"');
            console.error('   - If not running, start it: cd backend && npm run dev');
            console.error('');
            console.error('2. 🔍 CHECK BACKEND TERMINAL OUTPUT:');
            console.error('   - Should show: "📱 Mobile Device URL: http://' + serverIP + ':' + serverPort + '/api"');
            console.error('   - Verify the IP matches: ' + serverIP);
            console.error('');
            troubleshooting = [
              'Server is taking too long to respond',
              'Check if backend server is running',
              'Try restarting the backend server',
              'Verify the port number matches backend (check backend terminal)',
              'Check network connectivity between devices'
            ];
          } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
            console.error('🌐 Network error - Cannot reach server');
            console.error('');
            console.error('1. ✅ START BACKEND SERVER (if not running):');
            console.error('   cd backend');
            console.error('   npm run dev');
            console.error('   Look for: "🚀 C-COS Backend Server running on port ' + serverPort + '"');
            console.error('');
            console.error('2. 🔍 VERIFY IP ADDRESS:');
            console.error('   - Run on Windows: ipconfig');
            console.error('   - Look for "IPv4 Address" under your WiFi adapter');
            console.error('   - Current app IP: ' + serverIP);
            console.error('   - If different, update mobile/src/api/client.js line 8');
            console.error('');
            console.error('3. 🌐 CHECK NETWORK CONNECTION:');
            console.error('   - Ensure phone and computer are on SAME WiFi network');
            console.error('   - Try accessing from phone browser:');
            console.error('     http://' + serverIP + ':' + serverPort + '/health');
            console.error('   - Should show: {"status":"ok","timestamp":"..."}');
            console.error('');
            console.error('4. 🔥 CHECK WINDOWS FIREWALL:');
            console.error('   - Windows may be blocking port ' + serverPort);
            console.error('   - Allow Node.js through firewall');
            console.error('   - Or temporarily disable firewall for testing');
            console.error('');
            troubleshooting = [
              'Cannot reach server at ' + API_BASE_URL,
              '1. ✅ Start backend server: cd backend && npm run dev',
              '2. 🔍 Verify IP address matches (run: ipconfig)',
              '3. 🌐 Ensure both devices on same WiFi',
              '4. 🔥 Check Windows Firewall settings',
              '5. 📱 Test from phone browser: http://' + serverIP + ':' + serverPort + '/health',
              '6. 🔄 Update API_BASE_URL if IP changed',
              '7. 🔄 Restart both backend and mobile app'
            ];
          }
          
          console.error('═══════════════════════════════════════');
          console.error('');
          
          isTestingConnection = false;
          return { 
            success: false, 
            message: 'Cannot reach backend', 
            error: error.message,
            errorCode: error.code,
            attemptedUrl: healthUrl,
            troubleshooting 
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
        
        // Store user data - could be candidate, teacher, or admin
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
  
  getTimeRemaining: async (examId) => {
    const response = await apiClient.get(`/candidate/exams/${examId}/time-remaining`);
    return response.data;
  },
};

export default apiClient;

