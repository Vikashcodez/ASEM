import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createTables, testConnection } from './src/config/database.js';
import authRoutes from './src/routes/auth.Routes.js';
import employeeRoutes from './src/routes/employee.Routes.js';
import RolesRouter from './src/routes/roles.Routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', employeeRoutes);
app.use('/api/roles', RolesRouter);

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ message: 'Server is running', status: 'OK' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Initialize database and start server
const startServer = async () => {
    try {
        // Test database connection
        const isConnected = await testConnection();
        if (!isConnected) {
            throw new Error('Failed to connect to PostgreSQL');
        }
        
        // Create tables and setup database
        await createTables();
        
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Admin Email: ${process.env.ADMIN_EMAIL}`);
            console.log(`Admin Password: ${process.env.ADMIN_PASSWORD}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();