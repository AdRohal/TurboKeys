# TurboKeys - Typing Speed Test Application

A full-stack typing speed test application similar to Monkeytype, built with React.js, Spring Boot, and PostgreSQL.

## Features

- **User Authentication**: Email/password, Google OAuth2, GitHub OAuth2
- **Typing Tests**: Real-time WPM tracking, accuracy measurement, multiple timer modes
- **User Profiles**: Performance history and personal best scores
- **Leaderboards**: Global rankings by test mode
- **Customization**: Theme toggle, word language/difficulty settings

## Tech Stack

### Frontend
- React.js 18
- TypeScript
- Tailwind CSS
- Axios for API calls
- React Router for navigation

### Backend
- Node.js 18+
- Express.js
- JWT for authentication
- In-memory data storage (for development)
- bcryptjs for password hashing
- CORS enabled
- Rate limiting

### Infrastructure
- Docker & Docker Compose (optional)
- In-memory data storage for development

## Quick Start

### Prerequisites
- Node.js 18+
- npm (comes with Node.js)
- Docker & Docker Compose (optional)

### Automated Setup

**Windows:**
```cmd
.\setup-nodejs.ps1
```

**Linux/Mac:**
```bash
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
