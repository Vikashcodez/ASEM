import { pool } from '../config/database.js';

export const createRolesTable = async (req, res) => {
	const client = await pool.connect();
	try {
		await client.query(`
			CREATE TABLE IF NOT EXISTS Roles (
				id SERIAL PRIMARY KEY,
				name VARCHAR(50) UNIQUE NOT NULL,
				is_active BOOLEAN DEFAULT TRUE,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)
		`);

		return res.status(200).json({
			message: 'Roles table created or already exists'
		});
	} catch (error) {
		console.error('Error creating Roles table:', error);
		return res.status(500).json({
			message: 'Failed to create Roles table'
		});
	} finally {
		client.release();
	}
};

export const getRoles = async (req, res) => {
	try {
		const result = await pool.query(
			'SELECT id, name, is_active, created_at, updated_at FROM Roles ORDER BY id ASC'
		);
		return res.status(200).json(result.rows);
	} catch (error) {
		console.error('Error fetching roles:', error);
		return res.status(500).json({ message: 'Failed to fetch roles' });
	}
};
