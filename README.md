# TurboKeys - Typing Speed Test Application

A modern typing speed test application built with React.js, Node.js, and MongoDB.

## 🚀 Features

- **User Authentication**: Email/password, Google OAuth2, GitHub OAuth2
- **Profile Completion**: Complete your profile after OAuth signup with custom username
- **Typing Tests**: Real-time WPM tracking, accuracy measurement, multiple timer modes
- **User Profiles**: Performance history and personal best scores
- **Leaderboards**: Global rankings by test mode
- **Dark/Light Theme**: Customizable theme toggle
- **Persistent Data**: MongoDB storage for user accounts and test history

## 🛠️ Tech Stack

### Frontend
- React.js 18 with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Axios for API communication
- Context API for state management

### Backend
- Node.js 18+ with Express.js
- MongoDB with Mongoose ODM
- JWT authentication
- Passport.js for OAuth2
- bcryptjs for password hashing
- Rate limiting and security middleware

## 📋 Prerequisites

Before running the application, make sure you have:

- **Node.js 18+** and **npm** installed
- **MongoDB** installed and running locally
- **Git** for cloning the repository

## ⚠️ Important Port Requirements

**CRITICAL**: The application requires specific ports to function correctly:

- **Backend**: Must run on port `8081` (configured in OAuth callback URLs)
- **Frontend**: Must run on port `3000` (expected by backend CORS and OAuth redirects)

> **Note**: Do not change these ports as they are hardcoded in OAuth provider configurations (Google/GitHub). The OAuth callback URLs are registered with these specific ports.

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/TurboKeys.git
cd TurboKeys
```

### 2. Start MongoDB
Make sure MongoDB is running on your system:

**Windows:**
```cmd
# Start MongoDB service (if installed as a service)
net start MongoDB

# Or start manually if installed in a custom location
"C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe" --dbpath "C:\data\db"
```

**Linux/Mac:**
```bash
# Start MongoDB service
sudo systemctl start mongod

# Or using brew on Mac
brew services start mongodb-community
```

### 3. Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```bash
   NODE_ENV=development
   PORT=8081
   FRONTEND_URL=http://localhost:3000
   
   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=7d
   
   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/turbokeys
   
   # Session Secret
   SESSION_SECRET=your_session_secret_here
   
   # OAuth2 Configuration (Optional - for GitHub/Google login)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:8081/api/auth/oauth2/google/callback
   
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   GITHUB_CALLBACK_URL=http://localhost:8081/api/auth/oauth2/github/callback
   ```

4. **Start the backend server:**
   ```bash
   npm start
   ```
   
   **The backend MUST run on port 8081** - this is required for OAuth callbacks to work correctly.
   You should see: `🚀 TurboKeys Backend running on port 8081`

### 4. Frontend Setup

1. **Open a new terminal and navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the frontend development server:**
   ```bash
   npm start
   ```
   
   **The frontend MUST run on port 3000** - this is required for OAuth redirects to work correctly.
   You should see: `Local: http://localhost:3000`

## 🎯 Usage

1. **Open your browser** and go to `http://localhost:3000`
2. **Sign up** using email/password or OAuth (GitHub/Google)
3. **Complete your profile** if signing up via OAuth
4. **Start typing tests** and track your progress!

## 🔧 Development Commands

### Backend Commands
```bash
cd backend

# Start development server with auto-reload
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Frontend Commands
```bash
cd frontend

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

## 📁 Project Structure

```
TurboKeys/
├── backend/                 # Node.js Express server
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   └── server.js       # Main server file
│   ├── package.json
│   └── .env                # Environment variables
├── frontend/               # React.js application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript types
│   ├── package.json
│   └── public/             # Static assets
└── README.md
```

## 🔐 OAuth Setup (Optional)

To enable GitHub/Google authentication:

### GitHub OAuth
1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Create a new OAuth App with:
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:8081/api/auth/oauth2/github/callback`
3. Add the Client ID and Secret to your `.env` file

### Google OAuth
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID with:
   - Authorized redirect URI: `http://localhost:8081/api/auth/oauth2/google/callback`
3. Add the Client ID and Secret to your `.env` file

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Error:**
   - Ensure MongoDB is running: `mongod --version`
   - Check the connection string in `.env`

2. **Port Already in Use:**
   - **Backend (Port 8081):**
     ```bash
     # Windows
     netstat -ano | findstr :8081
     taskkill /PID <PID_NUMBER> /F
     
     # Linux/Mac
     lsof -ti:8081 | xargs kill -9
     ```
   - **Frontend (Port 3000):**
     ```bash
     # Windows
     netstat -ano | findstr :3000
     taskkill /PID <PID_NUMBER> /F
     
     # Linux/Mac
     lsof -ti:3000 | xargs kill -9
     ```

3. **⚠️ CRITICAL: Wrong Ports Used:**
   - **If backend runs on any port other than 8081**: OAuth will fail with "redirect_uri_mismatch"
   - **If frontend runs on any port other than 3000**: Authentication redirects will fail
   - **Solution**: Always ensure backend uses port 8081 and frontend uses port 3000

4. **OAuth Not Working:**
   - Verify OAuth app callback URLs match your `.env` configuration
   - Ensure OAuth credentials are correctly set in `.env`
   - Check that both servers are running on correct ports (8081 and 3000)

4. **CORS Errors:**
   - Verify `FRONTEND_URL` in backend `.env` matches frontend URL

### Logs and Debugging

- Backend logs: Check the terminal running `npm start` in backend directory
- Frontend logs: Check browser developer console
- MongoDB logs: Check MongoDB service logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
chmod +x setup.sh
./setup.sh
```

### Manual Setup

1. **Clone the repository**
   ```bash
   git clone <url>
   cd TurboKeys
   ```

2. **Start the database (if using Docker)**
   ```bash
   docker-compose up -d postgres
   ```

3. **Start the backend**
   
   **PowerShell/Windows:**
   ```powershell
   cd backend
   npm run dev
   ```
   
   **Bash/Linux/Mac:**
   ```bash
   cd backend
   npm run dev
   ```

4. **Start the frontend**
   
   **PowerShell/Windows:**
   ```powershell
   cd frontend
   npm install
   npm start
   ```
   
   **Bash/Linux/Mac:**
   ```bash
   cd frontend
   npm install
   npm start
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080

## Features

- **In-memory data storage**: Fast development without database setup
- **JWT Authentication**: Secure user login and registration
- **Real-time typing tests**: Multiple difficulty levels and languages
- **User profiles**: Track your progress and statistics
- **Leaderboards**: Compare your scores with others
- **Word lists**: English, Spanish, French with different difficulty levels
- **Programming mode**: Special word lists for developers

### OAuth2 Configuration

1. **Google OAuth2**: Get credentials from [Google Cloud Console](https://console.cloud.google.com/)
2. **GitHub OAuth2**: Create an app in [GitHub Developer Settings](https://github.com/settings/developers)
3. Update the client IDs and secrets in `frontend/.env` and `backend/src/main/resources/application.properties`

### Running without Docker (Recommended for Development)

**Quick Start:**
1. **Install Node.js 18+** from [nodejs.org](https://nodejs.org/)
2. **Run the setup script:**
   ```powershell
   .\setup-nodejs.ps1
   ```
3. **Start the backend:**
   ```powershell
   cd backend
   npm run dev
   ```
4. **Start the frontend (in another terminal):**
   ```powershell
   cd frontend
   npm start
   ```
5. **Open http://localhost:3000 in your browser**

**Manual Setup:**
1. **Install dependencies:**
   ```powershell
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

2. **Create environment files:**
   - Copy `backend/.env.example` to `backend/.env`
   - Copy `frontend/.env.example` to `frontend/.env` (or let the setup script create it)

3. **Start both services as shown above**

## Project Structure

```
TurboKeys/
├── frontend/              # React.js application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React context providers
│   │   ├── services/      # API services
│   │   └── types/         # TypeScript type definitions
│   ├── public/            # Static assets
│   ├── package.json       # Frontend dependencies
│   └── .env              # Frontend environment variables
├── backend/               # Node.js/Express.js API
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   └── server.js      # Main server file
│   ├── package.json       # Backend dependencies
│   └── .env              # Backend environment variables
├── docker-compose.yml     # Docker development environment
├── setup-nodejs.ps1      # PowerShell setup script
├── start-dev-both.ps1    # Start both services script
└── README.md
```

## Development

### Environment Variables

Create `.env` files in both frontend and backend directories with the required configuration.

### API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/tests/submit` - Submit typing test result
- `GET /api/tests/leaderboard` - Get leaderboard
- `GET /api/users/profile` - Get user profile

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License
