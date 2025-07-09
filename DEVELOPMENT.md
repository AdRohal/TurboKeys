# TurboKeys Development Guide

## Project Overview

TurboKeys is a full-stack typing speed test application built with:
- **Frontend**: React.js with TypeScript and Tailwind CSS
- **Backend**: Spring Boot with Java 17
- **Database**: PostgreSQL
- **Authentication**: JWT + OAuth2 (Google, GitHub)

## Quick Start

### Prerequisites

1. **Node.js** (v18 or higher)
2. **Java** (17 or higher)
3. **Docker** and **Docker Compose**
4. **Git**

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TurboKeys
   ```

2. **Run the setup script**
   
   **Windows:**
   ```cmd
   setup.bat
   ```
   
   **Linux/Mac:**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Start the application**
   
   **Terminal 1 (Backend):**
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```
   
   **Terminal 2 (Frontend):**
   ```bash
   cd frontend
   npm start
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080

## Development Workflow

### Backend Development

1. **Database Management**
   ```bash
   # Start PostgreSQL
   docker-compose up -d postgres
   
   # Access database
   docker exec -it turbokeys-postgres psql -U turbokeys_user -d turbokeys
   ```

2. **Running Tests**
   ```bash
   cd backend
   ./mvnw test
   ```

3. **Building the Application**
   ```bash
   ./mvnw clean package
   ```

### Frontend Development

1. **Installing Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Running in Development Mode**
   ```bash
   npm start
   ```

3. **Building for Production**
   ```bash
   npm run build
   ```

4. **Running Tests**
   ```bash
   npm test
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user info

### Typing Tests
- `POST /api/tests/submit` - Submit typing test result
- `GET /api/tests/user` - Get user's typing test history
- `GET /api/tests/leaderboard` - Get leaderboard by mode

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/stats` - Get user statistics

### Words
- `GET /api/words` - Get random words for typing test
- `GET /api/words/languages` - Get available languages

## Environment Configuration

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_GITHUB_CLIENT_ID=your_github_client_id
```

### Backend (application-dev.properties)
```properties
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/turbokeys
spring.datasource.username=turbokeys_user
spring.datasource.password=turbokeys_password

# JWT
jwt.secret=your_jwt_secret_here
jwt.expiration=86400000

# OAuth2
spring.security.oauth2.client.registration.google.client-id=your_google_client_id
spring.security.oauth2.client.registration.google.client-secret=your_google_client_secret
spring.security.oauth2.client.registration.github.client-id=your_github_client_id
spring.security.oauth2.client.registration.github.client-secret=your_github_client_secret
```

## OAuth2 Setup

### Google OAuth2
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth2 credentials
5. Set authorized redirect URIs:
   - `http://localhost:8080/oauth2/callback/google`
6. Update client ID and secret in configuration

### GitHub OAuth2
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Authorization callback URL:
   - `http://localhost:8080/oauth2/callback/github`
4. Update client ID and secret in configuration

## Docker Deployment

### Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production
```bash
# Build and start
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Scale services
docker-compose up -d --scale backend=3
```

## Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `username` (String, Unique)
- `email` (String, Unique)
- `password` (String, Hashed)
- `first_name` (String)
- `last_name` (String)
- `profile_picture` (String)
- `provider` (Enum: LOCAL, GOOGLE, GITHUB)
- `provider_id` (String)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### Typing Test Results Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `wpm` (Integer)
- `accuracy` (Double)
- `characters_typed` (Integer)
- `errors_count` (Integer)
- `duration` (Integer, seconds)
- `mode` (Enum: 15s, 30s, 60s, 120s)
- `language` (String)
- `text` (Text)
- `completed_at` (Timestamp)

## Features

### Core Features
- [x] User authentication (email/password)
- [x] OAuth2 login (Google, GitHub)
- [x] Real-time typing test
- [x] WPM and accuracy calculation
- [x] Multiple test modes (15s, 30s, 60s, 120s)
- [x] User profiles and statistics
- [x] Leaderboards
- [x] Dark/light theme toggle
- [x] Responsive design

### Advanced Features (Future)
- [ ] Custom text uploads
- [ ] Multiplayer typing races
- [ ] Typing lessons and tutorials
- [ ] Detailed analytics and progress tracking
- [ ] Mobile app support
- [ ] Additional languages
- [ ] Keyboard heatmap
- [ ] Voice dictation mode

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running: `docker-compose up -d postgres`
   - Check database credentials in configuration

2. **CORS Issues**
   - Verify frontend URL in backend CORS configuration
   - Ensure both frontend and backend are running on correct ports

3. **OAuth2 Not Working**
   - Check client IDs and secrets in configuration
   - Verify redirect URIs match exactly

4. **Build Failures**
   - Clear caches: `mvn clean` or `npm cache clean --force`
   - Check Java/Node versions

### Getting Help

1. Check the logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed
4. Check that all services are running on expected ports

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the LICENSE file for details.
