import {pool} from '../config/database.js';
import bcrypt from 'bcrypt';

const DEFAULT_PASSWORD = 'welcome';
const SALT_ROUNDS = 10;

// Helper function to hash password
const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

// Helper function to format employee data for response
const formatEmployeeResponse = (employee) => {
  return {
    id: employee.id,
    role_id: employee.role_id,
    first_name: employee.first_name,
    last_name: employee.last_name,
    contact_number: employee.contact_number,
    email: employee.email,
    address: employee.address ?? employee.adress ?? null,
    join_date: employee.join_date,
    is_active: employee.is_active,
    created_at: employee.created_at,
    updated_at: employee.updated_at,
    role_name: employee.role_name,
    full_name: `${employee.first_name} ${employee.last_name}`
  };
};

// CREATE - Register new employee (with default password 'welcome')
export const registerEmployee = async (req, res) => {
  try {
    const {
      role_id,
      first_name,
      last_name,
      contact_number,
      email,
      address,
      join_date,
      is_active = true
    } = req.body;

    // Validation
    if (!first_name || !last_name || !email) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, and email are required'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Hash default password
    const hashedPassword = await hashPassword(DEFAULT_PASSWORD);

    // Prepare address JSON
    const addressJson = address || {};

    const query = `
      INSERT INTO employees (
        role_id, first_name, last_name, contact_number, 
        email, adress, join_date, password, is_active, 
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const values = [
      role_id || null,
      first_name.trim(),
      last_name.trim(),
      contact_number || null,
      email.toLowerCase().trim(),
      addressJson,
      join_date || null,
      hashedPassword,
      is_active
    ];

    const result = await pool.query(query, values);
    
    // Fetch role name for response
    const employeeWithRole = await getEmployeeWithRole(result.rows[0].id);
    
    res.status(201).json({
      success: true,
      message: `Employee registered successfully. Default password is: ${DEFAULT_PASSWORD}`,
      data: formatEmployeeResponse(employeeWithRole)
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    console.error('Error registering employee:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Helper to get employee with role name
const getEmployeeWithRole = async (id) => {
  const query = `
    SELECT e.*, r.name as role_name
    FROM employees e
    LEFT JOIN Roles r ON e.role_id = r.id
    WHERE e.id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// READ - Get all employees
export const getAllEmployees = async (req, res) => {
  try {
    const { 
      is_active, 
      search, 
      role_id,
      from_date,
      to_date 
    } = req.query;
    
    let query = `
      SELECT e.*, r.name as role_name
      FROM employees e
      LEFT JOIN Roles r ON e.role_id = r.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    // Filter by active status
    if (is_active !== undefined) {
      query += ` AND e.is_active = $${paramIndex}`;
      params.push(is_active === 'true');
      paramIndex++;
    }
    
    // Filter by role
    if (role_id) {
      query += ` AND e.role_id = $${paramIndex}`;
      params.push(role_id);
      paramIndex++;
    }
    
    // Search by name or email
    if (search) {
      query += ` AND (
        e.first_name ILIKE $${paramIndex} OR 
        e.last_name ILIKE $${paramIndex} OR 
        e.email ILIKE $${paramIndex} OR
        CONCAT(e.first_name, ' ', e.last_name) ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    // Filter by join date range
    if (from_date) {
      query += ` AND e.join_date >= $${paramIndex}`;
      params.push(from_date);
      paramIndex++;
    }
    
    if (to_date) {
      query += ` AND e.join_date <= $${paramIndex}`;
      params.push(to_date);
      paramIndex++;
    }
    
    query += ` ORDER BY e.created_at DESC`;
    
    const result = await pool.query(query, params);
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows.map(emp => formatEmployeeResponse(emp))
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// READ - Get single employee by ID
export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const employee = await getEmployeeWithRole(id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: formatEmployeeResponse(employee)
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// UPDATE - Update employee
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      role_id,
      first_name,
      last_name,
      contact_number,
      email,
      address,
      join_date,
      is_active
    } = req.body;
    
    // Check if employee exists
    const checkQuery = 'SELECT id FROM employees WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Build dynamic update query
    const updates = [];
    const params = [];
    let paramIndex = 1;
    
    if (role_id !== undefined) {
      updates.push(`role_id = $${paramIndex}`);
      params.push(role_id || null);
      paramIndex++;
    }
    
    if (first_name !== undefined && first_name.trim() !== '') {
      updates.push(`first_name = $${paramIndex}`);
      params.push(first_name.trim());
      paramIndex++;
    }
    
    if (last_name !== undefined && last_name.trim() !== '') {
      updates.push(`last_name = $${paramIndex}`);
      params.push(last_name.trim());
      paramIndex++;
    }
    
    if (contact_number !== undefined) {
      updates.push(`contact_number = $${paramIndex}`);
      params.push(contact_number || null);
      paramIndex++;
    }
    
    if (email !== undefined) {
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }
      updates.push(`email = $${paramIndex}`);
      params.push(email.toLowerCase().trim());
      paramIndex++;
    }
    
    if (address !== undefined) {
      updates.push(`adress = $${paramIndex}`);
      params.push(address || {});
      paramIndex++;
    }
    
    if (join_date !== undefined) {
      updates.push(`join_date = $${paramIndex}`);
      params.push(join_date || null);
      paramIndex++;
    }
    
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      params.push(is_active);
      paramIndex++;
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    
    const query = `
      UPDATE employees 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    params.push(id);
    
    const result = await pool.query(query, params);
    const updatedEmployee = await getEmployeeWithRole(result.rows[0].id);
    
    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: formatEmployeeResponse(updatedEmployee)
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    console.error('Error updating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// DELETE - Hard delete employee
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if employee exists
    const checkQuery = 'SELECT id, first_name, last_name FROM employees WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    const query = 'DELETE FROM employees WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    
    res.status(200).json({
      success: true,
      message: `Employee ${checkResult.rows[0].first_name} ${checkResult.rows[0].last_name} deleted successfully`,
      data: { id: result.rows[0]?.id }
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// SOFT DELETE - Deactivate employee
export const deactivateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      UPDATE employees 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_active = true
      RETURNING *
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or already inactive'
      });
    }
    
    const employee = await getEmployeeWithRole(id);
    
    res.status(200).json({
      success: true,
      message: 'Employee deactivated successfully',
      data: formatEmployeeResponse(employee)
    });
  } catch (error) {
    console.error('Error deactivating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ACTIVATE - Activate employee
export const activateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      UPDATE employees 
      SET is_active = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_active = false
      RETURNING *
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or already active'
      });
    }
    
    const employee = await getEmployeeWithRole(id);
    
    res.status(200).json({
      success: true,
      message: 'Employee activated successfully',
      data: formatEmployeeResponse(employee)
    });
  } catch (error) {
    console.error('Error activating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// RESET PASSWORD - Reset employee password to default
export const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if employee exists
    const checkQuery = 'SELECT id, first_name, last_name FROM employees WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    const hashedPassword = await hashPassword(DEFAULT_PASSWORD);
    
    const query = `
      UPDATE employees 
      SET password = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id
    `;
    
    await pool.query(query, [hashedPassword, id]);
    
    res.status(200).json({
      success: true,
      message: `Password reset to default: ${DEFAULT_PASSWORD}`,
      data: { 
        id: parseInt(id),
        default_password: DEFAULT_PASSWORD 
      }
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// CHANGE PASSWORD - Change employee password
export const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { current_password, new_password } = req.body;
    
    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }
    
    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }
    
    // Get current password hash
    const getPasswordQuery = 'SELECT password FROM employees WHERE id = $1';
    const passwordResult = await pool.query(getPasswordQuery, [id]);
    
    if (passwordResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      current_password,
      passwordResult.rows[0].password
    );
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Hash new password
    const hashedNewPassword = await hashPassword(new_password);
    
    const query = `
      UPDATE employees 
      SET password = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;
    
    await pool.query(query, [hashedNewPassword, id]);
    
    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get employees by role
export const getEmployeesByRole = async (req, res) => {
  try {
    const { role_id } = req.params;
    
    const query = `
      SELECT e.*, r.name as role_name
      FROM employees e
      LEFT JOIN Roles r ON e.role_id = r.id
      WHERE e.role_id = $1
      ORDER BY e.first_name, e.last_name
    `;
    
    const result = await pool.query(query, [role_id]);
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows.map(emp => formatEmployeeResponse(emp))
    });
  } catch (error) {
    console.error('Error fetching employees by role:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get employee statistics
export const getEmployeeStats = async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_employees,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_employees,
        COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_employees,
        COUNT(DISTINCT role_id) as roles_occupied,
        COUNT(CASE WHEN join_date >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as joined_this_month
      FROM employees
    `;
    
    const result = await pool.query(query);
    
    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching employee stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};