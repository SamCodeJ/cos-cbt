# C-COS Desktop Candidate Portal

A web-based candidate interface for taking exams on desktop computers (PCs/Laptops) in physical halls or computer labs.

## 🎯 Features

- **Candidate Login**: Secure authentication using Student ID and password
- **Exam Dashboard**: View all assigned exams with status and availability
- **Exam Instructions**: Clear pre-exam instructions and guidelines
- **Exam Taking Interface**:
  - Real-time countdown timer
  - Question navigation (Previous/Next)
  - Question palette with status indicators (Answered/Flagged/Unanswered)
  - Flag questions for review
  - Auto-save functionality
  - Multi-answer support (checkbox for multiple correct answers)
  - HTML content support for questions and options
  - Time extension support (teacher can add time during exam)
- **Results Display**: 
  - Score and performance analysis
  - Pass/Fail status
  - Question-by-question review (if enabled)
  - Performance breakdown

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Notifications**: Sonner (toast)

## 📋 Prerequisites

- Node.js 18+ and npm
- Backend server running (see main project README)
- Network connectivity to backend server

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd desktop
npm install
```

### 2. Configure Environment

Create a `.env` file in the `desktop` folder:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

**For Local Network Setup (Physical Hall):**

If your backend server is running on `192.168.1.100` (your computer's IP), update the `.env` file:

```env
VITE_API_BASE_URL=http://192.168.1.100:3001/api
```

### 3. Run Development Server

```bash
npm run dev
```

The desktop portal will be available at `http://localhost:5174`

### 4. Build for Production

```bash
npm run build
```

The build output will be in the `dist/` folder.

## 🖥️ Local Network Setup (Physical Hall)

### For Computer Lab / Examination Hall Setup:

1. **Start Backend Server** on your main computer:
   ```bash
   cd backend
   npm run dev
   ```
   Note the IP address shown in the terminal (e.g., `192.168.1.100`)

2. **Build Desktop Portal**:
   ```bash
   cd desktop
   npm run build
   ```

3. **Serve the Build** (Option A - Using Node.js):
   ```bash
   npm install -g serve
   serve -s dist -p 5174
   ```

4. **Serve the Build** (Option B - Using Backend):
   Copy the `dist` folder contents to your backend's `public` folder

5. **Configure Network**:
   - Ensure all PCs are on the same network
   - Update `.env` file with correct backend IP address
   - Disable firewall or allow ports 3001 and 5174

6. **Access from Client PCs**:
   - Students open browser on their PC
   - Navigate to: `http://192.168.1.100:5174` (replace with your server IP)
   - Login with their Student ID and password
   - Take exams

## 🔐 Login Credentials

Candidates login using:
- **Student ID**: Provided by teacher during candidate creation
- **Password**: Provided by teacher during candidate creation

## 📝 Usage Flow

1. **Login**: Enter Student ID and password
2. **Dashboard**: View assigned exams
3. **Instructions**: Read exam instructions carefully
4. **Start Exam**: Begin the exam (timer starts)
5. **Answer Questions**: Navigate, answer, and flag questions
6. **Submit**: Submit exam when complete
7. **Results**: View results (if enabled by teacher)

## 🎨 Features Explained

### Timer
- Countdown timer displayed at top
- Turns amber when < 5 minutes remaining
- Auto-submits when time expires
- Supports time extensions from teacher

### Question Navigation
- **Previous/Next buttons**: Move through questions sequentially
- **Question Palette**: Jump to any question directly
- **Status Indicators**:
  - 🟢 Green: Answered
  - 🟡 Amber: Flagged for review
  - ⚪ Gray: Unanswered

### Answer Types
- **Single Answer**: Radio buttons (A, B, C, D)
- **Multiple Answers**: Checkboxes (select all correct)

### Auto-Save
- Answers saved automatically to localStorage
- Synced with backend on each answer selection
- Resume capability if browser refreshes

## 🔧 Configuration

### API Base URL

Update in `.env` file:

```env
# Local development
VITE_API_BASE_URL=http://localhost:3001/api

# Local network (replace with your IP)
VITE_API_BASE_URL=http://192.168.1.100:3001/api

# Production server
VITE_API_BASE_URL=https://your-domain.com/api
```

### Development Port

The dev server runs on port `5174` by default. To change it, update `package.json`:

```json
{
  "scripts": {
    "dev": "vite --port 5175"
  }
}
```

## 🐛 Troubleshooting

### Cannot Connect to Backend

1. **Check Backend is Running**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Verify API URL**:
   - Check `.env` file has correct backend URL
   - Ensure port matches backend (default: 3001)

3. **Network Issues**:
   - Ensure PC and server are on same network
   - Check firewall settings
   - Test backend health: `http://your-ip:3001/health`

### Exam Won't Start

1. Check exam is "active" and within start/end date
2. Verify candidate is assigned to the exam
3. Check browser console for errors
4. Ensure backend is reachable

### Timer Issues

1. Ensure system clock is synchronized
2. Check for JavaScript errors in console
3. Verify backend API returns `time_remaining_seconds`

## 📂 Project Structure

```
desktop/
├── src/
│   ├── api/
│   │   └── client.js          # API client and endpoints
│   ├── components/
│   │   └── ui/                # shadcn/ui components
│   ├── lib/
│   │   └── utils.js           # Utility functions
│   ├── pages/
│   │   ├── Login.jsx          # Login page
│   │   ├── Dashboard.jsx      # Exam dashboard
│   │   ├── ExamInstructions.jsx  # Pre-exam instructions
│   │   ├── ExamScreen.jsx     # Main exam interface
│   │   └── ResultScreen.jsx   # Results display
│   ├── App.jsx                # Main app with routing
│   ├── main.jsx               # Entry point
│   └── index.css              # Global styles
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🎯 Browser Compatibility

- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

## 📞 Support

For issues or questions:
1. Check backend logs for API errors
2. Check browser console for frontend errors
3. Verify network connectivity
4. Contact system administrator

---

**Built for modern computer-based testing in physical examination halls**
