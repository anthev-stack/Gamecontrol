#!/bin/bash

# GameControl Setup Script
# This script helps you set up GameControl for development

echo "🎮 GameControl Setup Script"
echo "=========================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found"
    echo "📝 Creating .env from example..."
    
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ .env file created"
        echo ""
        echo "⚠️  IMPORTANT: Please edit .env and add your:"
        echo "   - DATABASE_URL (PostgreSQL connection string)"
        echo "   - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)"
        echo ""
        read -p "Press Enter to continue after editing .env..."
    else
        echo "❌ .env.example not found"
        exit 1
    fi
else
    echo "✅ .env file exists"
fi

echo ""

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma Client"
    exit 1
fi

echo "✅ Prisma Client generated"
echo ""

# Run migrations
echo "🗄️  Setting up database..."
echo "This will create the database tables..."
npx prisma migrate dev --name init

if [ $? -ne 0 ]; then
    echo "❌ Failed to run migrations"
    echo "Please check your DATABASE_URL in .env"
    exit 1
fi

echo "✅ Database set up complete"
echo ""

# Summary
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "To start the development server, run:"
echo "  npm run dev"
echo ""
echo "Then open http://localhost:3000 in your browser"
echo ""
echo "First-time setup:"
echo "  1. Go to http://localhost:3000/register"
echo "  2. Create your admin account"
echo "  3. Start managing game servers!"
echo ""
echo "Happy coding! 🚀"

