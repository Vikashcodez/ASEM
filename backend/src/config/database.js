import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

const createTables = async () => {
    const client = await pool.connect();
    try {
        // Create enum type for role
        await client.query(`
            DO $$ BEGIN
                CREATE TYPE user_role AS ENUM ('admin', 'employee');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Create employees table
        await client.query(`
            CREATE TABLE IF NOT EXISTS employees (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                position VARCHAR(255),
                department VARCHAR(255),
                salary DECIMAL(10, 2),
                join_date DATE,
                role user_role DEFAULT 'employee',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create function to update updated_at timestamp
        await client.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        `);

        // Create trigger for updated_at
        await client.query(`
            DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
            CREATE TRIGGER update_employees_updated_at
                BEFORE UPDATE ON employees
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `);

        // Check if admin already exists
        const adminExists = await client.query(
            'SELECT * FROM employees WHERE email = $1',
            [process.env.ADMIN_EMAIL]
        );

        // Create default admin if not exists
        if (adminExists.rows.length === 0) {
            const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
            
            await client.query(
                `INSERT INTO employees (email, password, name, position, department, role) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [process.env.ADMIN_EMAIL, hashedPassword, 'Super Admin', 'Administrator', 'Management', 'admin']
            );
            console.log('Default admin created successfully');
        }

        console.log('Database tables created/verified successfully');
    } catch (error) {
        console.error('Error creating tables:', error);
        throw error;
    } finally {
        client.release();
    }
};

// Test database connection
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('PostgreSQL connected successfully');
        client.release();
        return true;
    } catch (error) {
        console.error('PostgreSQL connection error:', error);
        return false;
    }
};

export { pool, createTables, testConnection };