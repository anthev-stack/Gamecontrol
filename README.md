# GameControl 🎮

A modern, beautiful game server management panel for hosting **Counter-Strike 2**, **Minecraft**, and **Rust** servers.

![GameControl Dashboard](https://img.shields.io/badge/Next.js-14-black) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-Enabled-blue)

## Features

✨ **Modern UI** - Beautiful, responsive dashboard built with Next.js 14 and Tailwind CSS  
🔐 **Secure Authentication** - User authentication with NextAuth.js  
🗄️ **PostgreSQL Database** - Robust data storage with Prisma ORM  
🎯 **Multi-Game Support** - Manage CS2, Minecraft, and Rust servers  
⚡ **Real-time Status** - Monitor server status and control operations  
🔧 **Easy Configuration** - Simple forms to create and edit servers  
📱 **Responsive Design** - Works great on desktop, tablet, and mobile  

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Vercel (Frontend), Any VPS/Cloud (Game Servers)

## Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- PostgreSQL database (local or hosted)
- Git installed

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/Gamecontrol.git
cd Gamecontrol
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/gamecontrol?schema=public"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

**Generate a secure secret:**
```bash
openssl rand -base64 32
```

### 4. Set Up Database

```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view your database
npx prisma studio
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

### Local PostgreSQL

If you're running PostgreSQL locally:

```bash
# Create database
createdb gamecontrol

# Update .env with your connection string
DATABASE_URL="postgresql://postgres:password@localhost:5432/gamecontrol?schema=public"
```

### Hosted PostgreSQL (Recommended for Production)

We recommend these providers for hosting PostgreSQL:

- **[Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)** - Integrated with Vercel
- **[Supabase](https://supabase.com/)** - Free tier available
- **[Railway](https://railway.app/)** - PostgreSQL database hosting
- **[Neon](https://neon.tech/)** - Serverless PostgreSQL

## Deployment

### Deploy to Vercel

1. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/Gamecontrol.git
git push -u origin main
```

2. Go to [Vercel](https://vercel.com) and import your repository

3. Add environment variables in Vercel:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your Vercel deployment URL)

4. Deploy! 🚀

### Database Migrations on Production

After deploying, run migrations:

```bash
npx prisma migrate deploy
```

## Usage

### Creating Your First Account

1. Navigate to `/register` and create an account
2. Sign in with your credentials
3. You'll be redirected to the dashboard

### Adding a Game Server

1. Click "Create Server" on the dashboard
2. Fill in the server details:
   - **Name**: A friendly name for your server
   - **Game Type**: CS2, Minecraft, or Rust
   - **Host/IP**: The IP address of your VPS
   - **Port**: The game server port
   - **RCON Port** (optional): Remote console port
   - **RCON Password** (optional): For remote management
   - **Max Players**: Maximum player count
   - **Map** (optional): Default map to load
   - **Custom Arguments** (optional): Additional launch parameters

3. Click "Create Server"

### Managing Servers

- **Start/Stop**: Control server status with action buttons
- **Restart**: Quickly restart a running server
- **Edit**: Modify server configuration
- **Delete**: Remove a server (confirmation required)

## Project Structure

```
Gamecontrol/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── servers/      # Server management endpoints
│   │   └── register/     # User registration
│   ├── dashboard/        # Dashboard page
│   ├── login/            # Login page
│   ├── register/         # Registration page
│   └── layout.tsx        # Root layout
├── components/           # React components
│   ├── ServerCard.tsx    # Server display card
│   └── ServerModal.tsx   # Server create/edit modal
├── lib/                  # Utilities
│   ├── auth.ts          # NextAuth configuration
│   └── prisma.ts        # Prisma client
├── prisma/
│   └── schema.prisma    # Database schema
└── types/               # TypeScript type definitions
```

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Sign in
- `POST /api/register` - Create account

### Servers
- `GET /api/servers` - List all servers
- `POST /api/servers` - Create server
- `GET /api/servers/[id]` - Get server details
- `PATCH /api/servers/[id]` - Update server
- `DELETE /api/servers/[id]` - Delete server
- `POST /api/servers/[id]/status` - Start/stop/restart server

## Important Notes

⚠️ **Server Hosting**: This panel manages server *configurations*, but actual game servers must run on a VPS or dedicated server. The panel stores connection details and can trigger start/stop commands via SSH or Docker APIs (implementation needed for production).

🔒 **Security**: 
- Always use strong passwords
- Keep your `NEXTAUTH_SECRET` secure
- Use HTTPS in production
- Don't expose RCON passwords

## Future Enhancements

- [ ] Real server status monitoring via RCON
- [ ] SSH integration for actual server control
- [ ] Docker container management
- [ ] Server logs viewer
- [ ] Player management
- [ ] Automated backups
- [ ] Server analytics and metrics
- [ ] Email notifications
- [ ] Multi-user roles and permissions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Check existing issues for solutions

## Acknowledgments

Built with ❤️ using:
- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [NextAuth.js](https://next-auth.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Happy Gaming! 🎮**

