#!/bin/bash

echo "🚀 Setting up TurboKeys with MongoDB..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "📦 Installing backend dependencies..."
cd backend
npm install

echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

echo "🐳 Starting Docker containers..."
cd ..
docker-compose up -d mongodb

echo "⏳ Waiting for MongoDB to be ready..."
sleep 10

echo "🏃 Starting the application..."
docker-compose up --build

echo "✅ TurboKeys is ready!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8080"
echo "📊 MongoDB: mongodb://localhost:27017"
