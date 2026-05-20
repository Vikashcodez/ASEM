import { pool } from '../config/database.js';
import { hashPassword } from '../utils/bcryptHelper.js';
import { validationResult } from 'express-validator';

export const addEmployee = async (req, res) => {
    const client = await pool.connect();
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, name, position, department, salary, join_date } = req.body;

        // Check if employee already exists
        const existing = await client.query(
            'SELECT * FROM employees WHERE email = $1',
            [email]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'Employee with this email already exists' });
        }

        const hashedPassword = await hashPassword(password);

        const result = await client.query(
            `INSERT INTO employees (email, password, name, position, department, salary, join_date, role) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
             RETURNING id, email, name, position, department, salary, 
                       TO_CHAR(join_date, 'YYYY-MM-DD') as join_date`,
            [email, hashedPassword, name, position, department, salary, join_date, 'employee']
        );

        res.status(201).json({
            message: 'Employee added successfully',
            employee: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

export const getEmployees = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, email, name, position, department, salary, 
                    TO_CHAR(join_date, 'YYYY-MM-DD') as join_date, 
                    created_at 
             FROM employees 
             WHERE role = 'employee' 
             ORDER BY created_at DESC`
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT id, email, name, position, department, salary, 
                    TO_CHAR(join_date, 'YYYY-MM-DD') as join_date, 
                    created_at 
             FROM employees 
             WHERE id = $1 AND role = 'employee'`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateEmployee = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { name, position, department, salary, join_date } = req.body;

        const result = await client.query(
            `UPDATE employees 
             SET name = $1, position = $2, department = $3, salary = $4, join_date = $5 
             WHERE id = $6 AND role = 'employee' 
             RETURNING id`,
            [name, position, department, salary, join_date, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.json({ message: 'Employee updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

export const deleteEmployee = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const result = await client.query(
            'DELETE FROM employees WHERE id = $1 AND role = $2 RETURNING id',
            [id, 'employee']
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};