# C-COS - Computer-Based Testing System

A comprehensive Computer-Based Testing (CBT) system with a React web portal for administrators and teachers, and a React Native mobile app for candidates.

## 🎯 Features

### Web Portal (Admin + Teacher)

- **Role-Based Access Control**
  - Admin: Full system access, teacher management, audit logs
  - Teacher: Exam creation, candidate management, results viewing (own exams only)

- **Exam Management**
  - Multi-tab exam creation wizard
  - Question randomization (N questions from larger bank)
  - Bulk candidate and question upload via CSV
  - Configurable settings (duration, pass mark, show results toggle)
  - Exam duplication and editing

- **Question Bank**
  - Reusable question library
  - Subject and difficulty filtering
  - Import/Export functionality
  - Usage tracking

- **Results & Analytics**
  - Comprehensive result viewing with filters
  - Pass/fail distribution charts
  - Score distribution analysis
  - Violation logs
  - PDF transcript downloads
  - Question-by-question review

### Mobile App (Candidate)

- **Exam Taking Interface**
  - Clean, intuitive UI
  - Real-time countdown timer
  - Question navigation (Previous/Next)
  - Question palette (grid view)
  - Flag questions for review
  - Answer status indicators

- **Security Features**
  - Screen lock enforcement
  - Violation detection and logging
  - Auto-submit after 3 violations
  - Warning alerts

- **Offline Support**
  - Auto-save every 30 seconds
  - Resume exam from last position
  - Works on slow networks

- **Results Display**
  - Detailed score breakdown
  - Performance analysis
  - Question-by-question review (if enabled)
  - Pass/fail status

## 🛠️ Tech Stack

### Web Portal

- **Frontend Framework**: React 18 + Vite
- **Styling**: Tailwind CSS + shadcn/ui (Radix components)
- **Routing**: React Router v7
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Notifications**: Sonner (toast)

### Mobile App

- **Framework**: React Native + Expo
- **Navigation**: React Navigation
- **UI Library**: React Native Paper
- **State Management**: Zustand
- **Storage**: AsyncStorage
- **HTTP Client**: Axios

## 📁 Project Structure

```
c-cos/
├── web/                          # Web portal
│   ├── src/
│   │   ├── api/                  # API client and endpoints
│   │   │   └── client.js
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui components
│   │   │   └── StatCard.jsx
│   │   ├── lib/
│   │   │   └── utils.js         # Utility functions
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── MyExams.jsx
│   │   │   ├── CreateExam.jsx
│   │   │   ├── QuestionBank.jsx
│   │   │   ├── Results.jsx
│   │   │   ├── Candidates.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── ManageTeachers.jsx
│   │   │       └── AuditLogs.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── mobile/                       # Mobile app
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js
│   │   ├── screens/
│   │   │   ├── LoginScreen.js
│   │   │   ├── DashboardScreen.js
│   │   │   ├── ExamInstructionsScreen.js
│   │   │   ├── ExamScreen.js
│   │   │   └── ResultScreen.js
│   │   └── store/
│   │       └── authStore.js
│   ├── App.js
│   ├── package.json
│   └── app.json
│
├── csv-templates/               # CSV import templates
│   ├── candidates_template.csv
│   └── questions_template.csv
│
└── README.md
```

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+ and npm/yarn
- Backend API server (see Backend Integration section)
- For mobile development: Expo CLI, iOS Simulator/Android Emulator

### Web Portal Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   Create a `.env` file in the root directory:
   ```env
   VITE_API_BASE_URL=http://localhost:3000/api
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```
   The web portal will be available at `http://localhost:5173`

4. **Build for production**
   ```bash
   npm run build
   ```

### Mobile App Setup

1. **Navigate to mobile directory**
   ```bash
   cd mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API URL**
   Edit `mobile/src/api/client.js` and update `API_BASE_URL`:
   ```javascript
   const API_BASE_URL = 'http://your-api-url:3000/api';
   ```

4. **Start Expo development server**
   ```bash
   npm start
   ```

5. **Run on device/simulator**
   - iOS: `npm run ios` (requires macOS)
   - Android: `npm run android`
   - Web: `npm run web` (for testing only)

## 📊 CSV Templates

### Candidates Template (`candidates_template.csv`)

```csv
name,email,student_id
John Doe,john@example.com,ST001
Jane Smith,jane@example.com,ST002
Bob Johnson,bob@example.com,ST003
```

**Fields:**
- `name` (required): Full name of the candidate
- `email` (required): Email address for login
- `student_id` (optional): Student identification number

### Questions Template (`questions_template.csv`)

```csv
question_text,option_a,option_b,option_c,option_d,correct_answer,points
What is 2+2?,3,4,5,6,B,1
What is the capital of France?,London,Paris,Berlin,Madrid,B,1
Which planet is closest to the sun?,Venus,Earth,Mercury,Mars,C,1
```

**Fields:**
- `question_text` (required): The question text
- `option_a` (required): First answer option
- `option_b` (required): Second answer option
- `option_c` (optional): Third answer option
- `option_d` (optional): Fourth answer option
- `correct_answer` (required): A, B, C, or D
- `points` (optional): Points for the question (default: 1)

## 🔌 Backend Integration

The system expects a REST API with the following endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Exams (Teacher/Admin)
- `GET /api/exams` - List exams
- `GET /api/exams/:id` - Get exam details
- `POST /api/exams` - Create exam
- `PUT /api/exams/:id` - Update exam
- `DELETE /api/exams/:id` - Delete exam
- `POST /api/exams/:id/duplicate` - Duplicate exam
- `GET /api/exams/:id/candidates` - Get exam candidates
- `POST /api/exams/:id/candidates` - Add candidates
- `GET /api/exams/:id/questions` - Get exam questions
- `POST /api/exams/:id/questions` - Add questions

### Question Bank
- `GET /api/question-bank` - List questions
- `GET /api/question-bank/:id` - Get question
- `POST /api/question-bank` - Create question
- `PUT /api/question-bank/:id` - Update question
- `DELETE /api/question-bank/:id` - Delete question
- `POST /api/question-bank/bulk-import` - Bulk import

### Results
- `GET /api/results` - List results
- `GET /api/results/:id` - Get result details
- `GET /api/results/exam/:examId` - Get results by exam
- `GET /api/results/:id/transcript` - Download PDF transcript

### Teachers (Admin only)
- `GET /api/teachers` - List teachers
- `GET /api/teachers/:id` - Get teacher
- `POST /api/teachers` - Create teacher
- `PUT /api/teachers/:id` - Update teacher
- `POST /api/teachers/:id/deactivate` - Deactivate teacher

### Audit Logs (Admin only)
- `GET /api/audit-logs` - List audit logs

### Candidate Mobile API
- `POST /api/candidate/auth/login` - Candidate login
- `GET /api/candidate/exams` - Get assigned exams
- `GET /api/candidate/exams/:id` - Get exam details
- `POST /api/candidate/exams/:id/start` - Start exam
- `POST /api/candidate/exams/:id/save-answer` - Save answer
- `POST /api/candidate/exams/:id/submit` - Submit exam
- `GET /api/candidate/exams/:id/result` - Get result

### Authentication
All API requests (except login) should include JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## 🎨 Design System

The UI follows the design from the memtribe project with:

- **Colors**: 
  - Primary: Amber (amber-600, amber-700)
  - Base: Slate (slate-50 to slate-900)
  - Accents: Green (success), Blue (info), Red (destructive)

- **Components**: shadcn/ui (Radix primitives)
- **Icons**: Lucide React
- **Typography**: Clean, modern sans-serif
- **Layout**: Card-based design, collapsible sidebar
- **Effects**: Subtle shadows, smooth transitions, gradient backgrounds

## 🔐 Security Features

### Web Portal
- JWT-based authentication
- Role-based access control
- Protected routes
- Token refresh handling
- Input validation with Zod

### Mobile App
- Secure token storage (AsyncStorage)
- Screen lock enforcement
- Violation detection:
  - App minimization detection
  - Automatic logging with timestamp
  - Warning system (3 strikes)
  - Auto-submit after threshold
- Offline data encryption

## 📱 Mobile App Features

### Screen Lock Enforcement
The mobile app actively monitors for violations:

```javascript
// Detects when app goes to background
AppState.addEventListener('change', handleAppStateChange);

// Logs violations
{
  type: 'App Minimized',
  timestamp: '2024-01-15T10:30:00Z',
  description: 'Candidate minimized app during exam'
}

// Warning system
- Violation 1: Warning alert
- Violation 2: Warning alert
- Violation 3: Auto-submit exam
```

### Auto-Save System
- Saves answers every 30 seconds
- Stores progress in AsyncStorage
- Resumes from last position if app crashes
- Syncs with backend on each answer selection

### Timer Management
- Countdown timer with minutes:seconds format
- Red warning when < 5 minutes remaining
- Auto-submit when timer reaches 0
- Continues running in background

## 📈 Key Workflows

### Creating an Exam (Teacher)

1. Navigate to "Create Exam"
2. **Tab 1 - Basic Info**: Enter exam details
   - Title, Subject, Duration
   - Questions per candidate (e.g., 40 random from bank)
   - Pass mark, Start/End dates
3. **Tab 2 - Candidates**: Add candidates
   - Manual entry or CSV bulk upload
4. **Tab 3 - Questions**: Add questions to bank
   - Manual entry or CSV bulk upload
   - System will randomly select N questions per candidate
5. **Tab 4 - Settings**: Configure options
   - Show results toggle
   - Randomize questions (ON by default)
   - Randomize options
   - Enforce screen lock
6. Click "Create Exam"

### Taking an Exam (Candidate)

1. Login to mobile app
2. View assigned exams on dashboard
3. Select exam → "View Instructions"
4. Read instructions and warnings
5. Click "I Understand, Start Exam"
6. Answer questions using:
   - Next/Previous buttons
   - Question palette for navigation
   - Flag for review option
7. Submit exam when complete
8. View results (if enabled by teacher)

### Viewing Results (Teacher)

1. Navigate to "Results" page
2. Filter by exam (optional)
3. View analytics:
   - Pass/fail distribution
   - Score distribution chart
4. Click "Details" on any result to see:
   - Complete score breakdown
   - Violation log (if any)
5. Download PDF transcript

## 🧪 Demo Credentials

### Web Portal
- **Teacher**: `teacher@uiges.com` / `password`
- **Admin**: `admin@uiges.com` / `password`

### Mobile App
- **Candidate**: `candidate@uiges.com` / `password`

## 🐛 Troubleshooting

### Web Portal

**Issue**: `Module not found` errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Issue**: API connection failed
- Check `.env` file has correct `VITE_API_BASE_URL`
- Verify backend server is running
- Check CORS configuration on backend

### Mobile App

**Issue**: Expo start fails
```bash
# Clear Expo cache
expo start -c
```

**Issue**: Cannot connect to API
- Update `API_BASE_URL` in `mobile/src/api/client.js`
- Use computer's IP address for local testing (not localhost)
- Example: `http://192.168.1.100:3000/api`

**Issue**: Screen lock not working
- Ensure `enforce_screen_lock` is enabled in exam settings
- Test on physical device (simulators may not detect app state changes accurately)

## 📝 Development Notes

### Adding New shadcn/ui Components

```bash
# Install shadcn/ui CLI (if not already installed)
npx shadcn-ui@latest init

# Add specific component
npx shadcn-ui@latest add [component-name]
```

### Building for Production

**Web Portal**:
```bash
npm run build
# Output: dist/ folder
# Deploy to any static hosting (Vercel, Netlify, etc.)
```

**Mobile App**:
```bash
# Build for iOS
expo build:ios

# Build for Android
expo build:android

# Or use EAS Build (recommended)
eas build --platform all
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (web and mobile)
5. Submit a pull reque

## 🙏 Acknowledgments

- Design inspiration: memtribe project
- UI Components: shadcn/ui
- Icons: Lucide React
- Charts: Recharts

## 📞 Support

For issues, questions, or feature requests, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ for modern education and assessment**

