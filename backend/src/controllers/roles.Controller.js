import { pool } from '../config/database.js';

// Helper function to handle updated_at timestamp
const updateTimestamp = async (table, id) => {
  await pool.query(
    `UPDATE ${table} SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [id]
  );
};

// CREATE - Insert a new role
export const createRole = async (req, res) => {
  try {
    const { name, is_active = true } = req.body;
    
    // Validation
    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Role name is required' 
      });
    }
    
    const query = `
      INSERT INTO Roles (name, is_active, created_at, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const result = await pool.query(query, [name.trim(), is_active]);
    
    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    // Handle duplicate key violation
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Role name already exists'
      });
    }
    
    console.error('Error creating role:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// READ - Get all roles
export const getAllRoles = async (req, res) => {
  try {
    const { is_active, search } = req.query;
    let query = `
      SELECT id, name, is_active, 
             TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
             TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at
      FROM Roles 
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    // Filter by active status
    if (is_active !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(is_active === 'true');
      paramIndex++;
    }
    
    // Search by name
    if (search) {
      query += ` AND name ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const result = await pool.query(query, params);
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// READ - Get single role by ID
export const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT id, name, is_active,
             TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
             TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at
      FROM Roles 
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// UPDATE - Update a role
export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, is_active } = req.body;
    
    // Check if role exists
    const checkQuery = 'SELECT id FROM Roles WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    // Build dynamic update query
    const updates = [];
    const params = [];
    let paramIndex = 1;
    
    if (name !== undefined && name.trim() !== '') {
      updates.push(`name = $${paramIndex}`);
      params.push(name.trim());
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
      UPDATE Roles 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    params.push(id);
    
    const result = await pool.query(query, params);
    
    res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Role name already exists'
      });
    }
    
    console.error('Error updating role:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// DELETE - Delete a role (Hard delete)
export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if role exists
    const checkQuery = 'SELECT id FROM Roles WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    const query = 'DELETE FROM Roles WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    
    res.status(200).json({
      success: true,
      message: 'Role deleted successfully',
      data: { id: result.rows[0]?.id }
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// SOFT DELETE - Deactivate role (instead of hard delete)
export const deactivateRole = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      UPDATE Roles 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_active = true
      RETURNING *
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Role not found or already inactive'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Role deactivated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error deactivating role:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ACTIVATE - Activate a role
export const activateRole = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      UPDATE Roles 
      SET is_active = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_active = false
      RETURNING *
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Role not found or already active'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Role activated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error activating role:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};