import { pool } from '../config/database.js';
import { comparePassword } from '../utils/bcryptHelper.js';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';

export const login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Allow admin login directly from environment credentials.
        if (
            email === process.env.ADMIN_EMAIL &&
            password === process.env.ADMIN_PASSWORD
        ) {
            const token = jwt.sign(
                {
                    id: 0,
                    email: process.env.ADMIN_EMAIL,
                    role: 'admin',
                    name: 'Super Admin'
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            return res.json({
                message: 'Login successful',
                token,
                user: {
                    id: 0,
                    email: process.env.ADMIN_EMAIL,
                    name: 'Super Admin',
                    role: 'admin'
                }
            });
        }

        const result = await pool.query(
            `SELECT e.*, r.name AS role_name
             FROM employees e
             LEFT JOIN Roles r ON e.role_id = r.id
             WHERE e.email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = result.rows[0];
        const isValidPassword = await comparePassword(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role_name || 'employee',
                name: `${user.first_name} ${user.last_name}`.trim()
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: `${user.first_name} ${user.last_name}`.trim(),
                role: user.role_name || 'employee',
                position: null,
                department: null
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getProfile = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT e.id,
                    e.email,
                    CONCAT(e.first_name, ' ', e.last_name) AS name,
                    e.adress AS address,
                    NULL::text AS position,
                    NULL::text AS department,
                    NULL::numeric AS salary,
                    TO_CHAR(e.join_date, 'YYYY-MM-DD') as join_date,
                    COALESCE(r.name, 'employee') AS role,
                    e.created_at
             FROM employees e
             LEFT JOIN Roles r ON e.role_id = r.id
             WHERE e.id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};