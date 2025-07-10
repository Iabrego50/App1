# Task Manager - Full Stack React Application

A modern, full-stack task management application built with React, Node.js, TypeScript, and SQLite.

## 🚀 Features

- **User Authentication**: Secure login/register with JWT tokens
- **Task Management**: Create, edit, delete, and update task status
- **Modern UI**: Beautiful interface built with Tailwind CSS
- **Real-time Updates**: Instant task status changes
- **Responsive Design**: Works on desktop and mobile devices
- **Type Safety**: Full TypeScript support for both frontend and backend

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **SQLite** database
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Express Validator** for input validation

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd my-app
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   Create a `.env` file in the server directory:
   ```env
   PORT=5000
   JWT_SECRET=your-super-secret-jwt-key
   CLIENT_URL=http://localhost:3000
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

This will start both the backend server (port 5000) and frontend development server (port 3000).

## 🏃‍♂️ Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run server` - Start only the backend server
- `npm run client` - Start only the frontend development server
- `npm run build` - Build the frontend for production
- `npm start` - Start the production server

## 📁 Project Structure

```
my-app/
├── client/                 # React frontend
│   ├── public/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   └── index.tsx       # App entry point
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── database/       # Database setup
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   └── index.ts        # Server entry point
│   └── package.json
└── package.json            # Root package.json
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/profile` - Get user profile (protected)
- `PUT /api/users/profile` - Update user profile (protected)

### Tasks
- `GET /api/tasks` - Get all tasks for user (protected)
- `POST /api/tasks` - Create new task (protected)
- `PUT /api/tasks/:id` - Update task (protected)
- `DELETE /api/tasks/:id` - Delete task (protected)

## 🎨 UI Components

The application includes several reusable components:
- **Layout**: Main app layout with header and navigation
- **Login/Register Forms**: Authentication forms with validation
- **Task Cards**: Individual task display with actions
- **Task Form**: Create/edit task form
- **Status Badges**: Visual indicators for task priority and status

## 🔒 Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Input validation and sanitization
- CORS configuration
- Helmet.js for security headers

## 🚀 Deployment

### Frontend (Vercel/Netlify)
1. Build the frontend: `npm run build`
2. Deploy the `client/build` folder

### Backend (Heroku/Railway)
1. Set environment variables
2. Deploy the `server` folder
3. Update the frontend API base URL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues or have questions, please open an issue on GitHub. 

**Your deployed app is available at:**
```
https://backvault-production.up.railway.app
```

### To access your app:

1. **Click on the URL** or copy and paste it into your browser
2. **Or click the "Update" button** to make sure the domain is active

### What you should see:

- Your React app should load in the browser
- You can register/login and use all the features
- The app will be accessible to anyone with the URL

### Test your app:

1. **Open the URL in a new browser tab**
2. **Try registering a new account**
3. **Test the main features** (projects, uploads, etc.)

### If the app doesn't load:

- Make sure the deployment completed successfully
- Check if there are any error messages in the Deploy Logs
- The app might take a minute to fully start up

**Your app is now live and publicly accessible!** 🚀

Let me know if the app loads correctly or if you encounter any issues! 