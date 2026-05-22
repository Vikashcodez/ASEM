import {pool} from '../config/database.js';

// Helper function to format terminal response
const formatTerminalResponse = (terminal) => {
  return {
    id: terminal.id,
    terminal_name: terminal.terminal_name,
    terminal_code: terminal.terminal_code,
    description: terminal.description,
    is_active: terminal.is_active,
    created_at: terminal.created_at,
    updated_at: terminal.updated_at
  };
};

// Helper function to generate terminal code from name
const generateTerminalCode = (terminalName) => {
  return terminalName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .substring(0, 20);
};

// CREATE - Create a new terminal
export const createTerminal = async (req, res) => {
  try {
    const { 
      terminal_name, 
      terminal_code, 
      description, 
      is_active = true 
    } = req.body;
    
    // Validation
    if (!terminal_name || terminal_name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Terminal name is required'
      });
    }
    
    // Generate terminal code if not provided
    let finalTerminalCode = terminal_code;
    if (!finalTerminalCode) {
      finalTerminalCode = generateTerminalCode(terminal_name);
    }
    
    const query = `
      INSERT INTO Terminals (
        terminal_name, 
        terminal_code, 
        description, 
        is_active, 
        created_at, 
        updated_at
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const values = [
      terminal_name.trim(),
      finalTerminalCode,
      description || null,
      is_active
    ];
    
    const result = await pool.query(query, values);
    
    res.status(201).json({
      success: true,
      message: 'Terminal created successfully',
      data: formatTerminalResponse(result.rows[0])
    });
  } catch (error) {
    // Handle unique constraint violation for terminal_code
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Terminal code already exists'
      });
    }
    
    console.error('Error creating terminal:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// READ - Get all terminals
export const getAllTerminals = async (req, res) => {
  try {
    const { 
      is_active, 
      search,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;
    
    let query = `
      SELECT 
        id, 
        terminal_name, 
        terminal_code, 
        description, 
        is_active,
        TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
        TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at
      FROM Terminals 
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
    
    // Search by terminal name or code
    if (search) {
      query += ` AND (
        terminal_name ILIKE $${paramIndex} OR 
        terminal_code ILIKE $${paramIndex} OR
        description ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    // Validate sort column to prevent SQL injection
    const allowedSortColumns = ['id', 'terminal_name', 'terminal_code', 'created_at', 'updated_at', 'is_active'];
    const validSortBy = allowedSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const validSortOrder = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    query += ` ORDER BY ${validSortBy} ${validSortOrder}`;
    
    const result = await pool.query(query, params);
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows.map(terminal => formatTerminalResponse(terminal))
    });
  } catch (error) {
    console.error('Error fetching terminals:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// READ - Get single terminal by ID
export const getTerminalById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        id, 
        terminal_name, 
        terminal_code, 
        description, 
        is_active,
        TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
        TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at
      FROM Terminals 
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Terminal not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: formatTerminalResponse(result.rows[0])
    });
  } catch (error) {
    console.error('Error fetching terminal:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// READ - Get terminal by code
export const getTerminalByCode = async (req, res) => {
  try {
    const { code } = req.params;
    
    const query = `
      SELECT 
        id, 
        terminal_name, 
        terminal_code, 
        description, 
        is_active,
        TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
        TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at
      FROM Terminals 
      WHERE terminal_code = $1
    `;
    
    const result = await pool.query(query, [code]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Terminal not found with this code'
      });
    }
    
    res.status(200).json({
      success: true,
      data: formatTerminalResponse(result.rows[0])
    });
  } catch (error) {
    console.error('Error fetching terminal by code:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// UPDATE - Update terminal
export const updateTerminal = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      terminal_name, 
      terminal_code, 
      description, 
      is_active 
    } = req.body;
    
    // Check if terminal exists
    const checkQuery = 'SELECT id FROM Terminals WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Terminal not found'
      });
    }
    
    // Build dynamic update query
    const updates = [];
    const params = [];
    let paramIndex = 1;
    
    if (terminal_name !== undefined && terminal_name.trim() !== '') {
      updates.push(`terminal_name = $${paramIndex}`);
      params.push(terminal_name.trim());
      paramIndex++;
    }
    
    if (terminal_code !== undefined) {
      if (terminal_code.trim() === '') {
        // Auto-generate code from name if available
        const nameForCode = terminal_name || (await getTerminalNameById(id));
        updates.push(`terminal_code = $${paramIndex}`);
        params.push(generateTerminalCode(nameForCode));
      } else {
        updates.push(`terminal_code = $${paramIndex}`);
        params.push(terminal_code.trim());
      }
      paramIndex++;
    }
    
    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(description || null);
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
      UPDATE Terminals 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    params.push(id);
    
    const result = await pool.query(query, params);
    
    // Get updated terminal with formatted dates
    const updatedTerminal = await getTerminalByIdFormatted(result.rows[0].id);
    
    res.status(200).json({
      success: true,
      message: 'Terminal updated successfully',
      data: formatTerminalResponse(updatedTerminal)
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Terminal code already exists'
      });
    }
    
    console.error('Error updating terminal:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Helper function to get terminal name by ID
const getTerminalNameById = async (id) => {
  const result = await pool.query('SELECT terminal_name FROM Terminals WHERE id = $1', [id]);
  return result.rows[0]?.terminal_name || '';
};

// Helper function to get terminal with formatted dates
const getTerminalByIdFormatted = async (id) => {
  const query = `
    SELECT 
      id, 
      terminal_name, 
      terminal_code, 
      description, 
      is_active,
      TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
      TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at
    FROM Terminals 
    WHERE id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// DELETE - Hard delete terminal
export const deleteTerminal = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if terminal exists
    const checkQuery = 'SELECT id, terminal_name, terminal_code FROM Terminals WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Terminal not found'
      });
    }
    
    const query = 'DELETE FROM Terminals WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    
    res.status(200).json({
      success: true,
      message: `Terminal "${checkResult.rows[0].terminal_name}" deleted successfully`,
      data: { 
        id: result.rows[0]?.id,
        terminal_name: checkResult.rows[0].terminal_name,
        terminal_code: checkResult.rows[0].terminal_code
      }
    });
  } catch (error) {
    // Check for foreign key constraints
    if (error.code === '23503') {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete terminal as it is referenced by other records'
      });
    }
    
    console.error('Error deleting terminal:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// SOFT DELETE - Deactivate terminal
export const deactivateTerminal = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      UPDATE Terminals 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_active = true
      RETURNING *
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Terminal not found or already inactive'
      });
    }
    
    const terminal = await getTerminalByIdFormatted(id);
    
    res.status(200).json({
      success: true,
      message: 'Terminal deactivated successfully',
      data: formatTerminalResponse(terminal)
    });
  } catch (error) {
    console.error('Error deactivating terminal:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ACTIVATE - Activate terminal
export const activateTerminal = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      UPDATE Terminals 
      SET is_active = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_active = false
      RETURNING *
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Terminal not found or already active'
      });
    }
    
    const terminal = await getTerminalByIdFormatted(id);
    
    res.status(200).json({
      success: true,
      message: 'Terminal activated successfully',
      data: formatTerminalResponse(terminal)
    });
  } catch (error) {
    console.error('Error activating terminal:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// BULK OPERATIONS - Bulk create terminals
export const bulkCreateTerminals = async (req, res) => {
  try {
    const { terminals } = req.body;
    
    if (!Array.isArray(terminals) || terminals.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Terminals array is required'
      });
    }
    
    const results = [];
    const errors = [];
    
    for (const terminal of terminals) {
      try {
        if (!terminal.terminal_name) {
          errors.push({ 
            terminal: terminal, 
            error: 'Terminal name is required' 
          });
          continue;
        }
        
        const terminalCode = terminal.terminal_code || generateTerminalCode(terminal.terminal_name);
        
        const query = `
          INSERT INTO Terminals (
            terminal_name, terminal_code, description, is_active
          ) VALUES ($1, $2, $3, $4)
          RETURNING id, terminal_name, terminal_code
        `;
        
        const values = [
          terminal.terminal_name.trim(),
          terminalCode,
          terminal.description || null,
          terminal.is_active !== undefined ? terminal.is_active : true
        ];
        
        const result = await pool.query(query, values);
        results.push(result.rows[0]);
      } catch (error) {
        errors.push({ 
          terminal_name: terminal.terminal_name, 
          error: error.message 
        });
      }
    }
    
    res.status(201).json({
      success: true,
      message: `Successfully created ${results.length} terminals`,
      data: { 
        successful: results,
        failed: errors 
      }
    });
  } catch (error) {
    console.error('Error bulk creating terminals:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get terminal statistics
export const getTerminalStats = async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_terminals,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_terminals,
        COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_terminals,
        COUNT(DISTINCT terminal_code) as unique_codes,
        COUNT(CASE WHEN description IS NOT NULL THEN 1 END) as terminals_with_description
      FROM Terminals
    `;
    
    const result = await pool.query(query);
    
    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching terminal stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Search terminals with advanced filters
export const searchTerminals = async (req, res) => {
  try {
    const { 
      name, 
      code, 
      is_active,
      created_from,
      created_to 
    } = req.query;
    
    let query = `
      SELECT 
        id, 
        terminal_name, 
        terminal_code, 
        description, 
        is_active,
        TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
        TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at
      FROM Terminals 
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (name) {
      query += ` AND terminal_name ILIKE $${paramIndex}`;
      params.push(`%${name}%`);
      paramIndex++;
    }
    
    if (code) {
      query += ` AND terminal_code ILIKE $${paramIndex}`;
      params.push(`%${code}%`);
      paramIndex++;
    }
    
    if (is_active !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(is_active === 'true');
      paramIndex++;
    }
    
    if (created_from) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(created_from);
      paramIndex++;
    }
    
    if (created_to) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(created_to);
      paramIndex++;
    }
    
    query += ` ORDER BY terminal_name ASC`;
    
    const result = await pool.query(query, params);
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows.map(terminal => formatTerminalResponse(terminal))
    });
  } catch (error) {
    console.error('Error searching terminals:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};