// server/index.js
const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

// Import routes
const cardRoutes = require('./routes/cardRoutes');

// Initialize environment variables
dotenv.config();

// Create Express app
const app = express();
const server = http.createServer(app);

// Configure CORS
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Make db available to routes
app.use((req, res, next) => {
    req.db = pool;
    next();
});

// API Routes
app.use('/api/card', cardRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Clean up Prisma connection when server shuts down
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit();
});


// Start server
const PORT = process.env.PORT || 6000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server };