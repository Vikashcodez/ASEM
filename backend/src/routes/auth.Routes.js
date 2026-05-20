import express from 'express';
import { login, getProfile } from '../controllers/auth.Controller.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { body } from 'express-validator';

const router = express.Router();

router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').notEmpty().withMessage('Password is required')
    ],
    login
);

router.get('/profile', authenticateToken, getProfile);

export default router;