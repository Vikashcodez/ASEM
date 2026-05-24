import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

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
            CREATE TABLE IF NOT EXISTS Roles (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) UNIQUE NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

// employees table
        await client.query(`
            CREATE TABLE IF NOT EXISTS employees (
                id SERIAL PRIMARY KEY,
                role_id INTEGER REFERENCES Roles(id) ON DELETE SET NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                contact_number VARCHAR(20),
                email VARCHAR(255) UNIQUE NOT NULL,
                adress JSONB,
                join_date DATE,
                password VARCHAR(255) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

// Building Setup Tables
//Terminals table
    await client.query(`
    CREATE TABLE IF NOT EXISTS Terminals (
        id SERIAL PRIMARY KEY,
        terminal_name VARCHAR(100) NOT NULL,
        terminal_code VARCHAR(50),
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`)

// Blocks table
await client.query(`
    CREATE TABLE IF NOT EXISTS Blocks (
        id SERIAL PRIMARY KEY,
        terminal_id INT REFERENCES Terminals(id) ON DELETE CASCADE,
        block_name VARCHAR(100) NOT NULL,
        block_code VARCHAR(50),
        block_type VARCHAR(100),
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`)

// Floors table
await client.query(`
    CREATE TABLE IF NOT EXISTS Floors (
        id SERIAL PRIMARY KEY,
        terminal_id INT REFERENCES Terminals(id) ON DELETE CASCADE,
        block_id INT REFERENCES Blocks(id) ON DELETE CASCADE,
        floor_name VARCHAR(100) NOT NULL,
        floor_number INT NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`)

// Rooms table
await client.query(`
    CREATE TABLE IF NOT EXISTS Rooms (
        id SERIAL PRIMARY KEY,
        terminal_id INT REFERENCES Terminals(id) ON DELETE CASCADE,
        block_id INT REFERENCES Blocks(id) ON DELETE CASCADE,
        floor_id INT REFERENCES Floors(id) ON DELETE CASCADE,

        room_name VARCHAR(100) NOT NULL,
        room_code VARCHAR(50) UNIQUE NOT NULL,
        room_type VARCHAR(100),

        max_capacity INT DEFAULT 0,
        current_occupancy INT DEFAULT 0,

        room_status VARCHAR(50) DEFAULT 'AVAILABLE',

        description TEXT,

        is_active BOOLEAN DEFAULT TRUE,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`)

// Incidents table
await client.query(`
    CREATE TABLE IF NOT EXISTS Incidents (
        id SERIAL PRIMARY KEY,
        room_id INT REFERENCES Rooms(id) ON DELETE CASCADE,
        incident_code VARCHAR(100) UNIQUE NOT NULL,
        incident_type VARCHAR(100) NOT NULL,
        incident_title VARCHAR(200),
        location_details TEXT,
        description TEXT,
        severity_level VARCHAR(50),
        incident_status VARCHAR(50) DEFAULT 'OPEN',
        total_people INT DEFAULT 0,
        reported_by INT REFERENCES employees(id) ON DELETE SET NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`)

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