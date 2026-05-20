import express from 'express';
import {
    addEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee
} from '../controllers/employee.Controller.js';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware.js';
import { body } from 'express-validator';

const router = express.Router();

// All employee routes require authentication and admin role
router.use(authenticateToken, isAdmin);

router.post(
    '/employees',
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('name').notEmpty().withMessage('Name is required'),
        body('position').notEmpty().withMessage('Position is required'),
        body('department').notEmpty().withMessage('Department is required'),
        body('salary').isNumeric().withMessage('Salary must be a number'),
        body('join_date').isDate().withMessage('Valid join date is required')
    ],
    addEmployee
);

router.get('/employees', getEmployees);
router.get('/employees/:id', getEmployeeById);
router.put('/employees/:id', updateEmployee);
router.delete('/employees/:id', deleteEmployee);

export default router;