import {pool} from '../config/database.js';

// Helper function to format block response
const formatBlockResponse = (block) => {
  return {
    id: block.id,
    terminal_id: block.terminal_id,
    terminal_name: block.terminal_name,
    block_name: block.block_name,
    block_code: block.block_code,
    block_type: block.block_type,
    description: block.description,
    is_active: block.is_active,
    created_at: block.created_at,
    updated_at: block.updated_at
  };
};

// Helper function to generate block code
const generateBlockCode = (blockName, terminalCode) => {
  const prefix = terminalCode ? `${terminalCode}_` : '';
  const code = blockName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .substring(0, 30);
  return `${prefix}${code}`;
};

// Helper to get terminal code by ID
const getTerminalCode = async (terminalId) => {
  if (!terminalId) return null;
  const result = await pool.query('SELECT terminal_code FROM Terminals WHERE id = $1', [terminalId]);
  return result.rows[0]?.terminal_code;
};

// CREATE - Create a new block
export const createBlock = async (req, res) => {
  try {
    const {
      terminal_id,
      block_name,
      block_code,
      block_type,
      description,
      is_active = true
    } = req.body;

    // Validation
    if (!block_name || block_name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Block name is required'
      });
    }

    // Check if terminal exists if terminal_id is provided
    if (terminal_id) {
      const terminalCheck = await pool.query('SELECT id, terminal_code FROM Terminals WHERE id = $1', [terminal_id]);
      if (terminalCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Referenced terminal does not exist'
        });
      }
    }

    // Generate block code if not provided
    let finalBlockCode = block_code;
    if (!finalBlockCode) {
      const terminalCode = terminal_id ? await getTerminalCode(terminal_id) : null;
      finalBlockCode = generateBlockCode(block_name, terminalCode);
    }

    const query = `
      INSERT INTO Blocks (
        terminal_id, block_name, block_code, block_type, 
        description, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const values = [
      terminal_id || null,
      block_name.trim(),
      finalBlockCode,
      block_type || null,
      description || null,
      is_active
    ];

    const result = await pool.query(query, values);
    
    // Fetch with terminal name for response
    const blockWithTerminal = await getBlockWithTerminal(result.rows[0].id);
    
    res.status(201).json({
      success: true,
      message: 'Block created successfully',
      data: formatBlockResponse(blockWithTerminal)
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Block code already exists'
      });
    }
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Invalid terminal reference'
      });
    }
    
    console.error('Error creating block:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Helper to get block with terminal name
const getBlockWithTerminal = async (id) => {
  const query = `
    SELECT b.*, t.terminal_name, t.terminal_code as terminal_code_ref
    FROM Blocks b
    LEFT JOIN Terminals t ON b.terminal_id = t.id
    WHERE b.id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// READ - Get all blocks
export const getAllBlocks = async (req, res) => {
  try {
    const {
      terminal_id,
      is_active,
      block_type,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    let query = `
      SELECT 
        b.*,
        t.terminal_name,
        t.terminal_code as terminal_code_ref,
        TO_CHAR(b.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
        TO_CHAR(b.updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at
      FROM Blocks b
      LEFT JOIN Terminals t ON b.terminal_id = t.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // Filter by terminal
    if (terminal_id) {
      query += ` AND b.terminal_id = $${paramIndex}`;
      params.push(terminal_id);
      paramIndex++;
    }

    // Filter by active status
    if (is_active !== undefined) {
      query += ` AND b.is_active = $${paramIndex}`;
      params.push(is_active === 'true');
      paramIndex++;
    }

    // Filter by block type
    if (block_type) {
      query += ` AND b.block_type = $${paramIndex}`;
      params.push(block_type);
      paramIndex++;
    }

    // Search by block name, code, or description
    if (search) {
      query += ` AND (
        b.block_name ILIKE $${paramIndex} OR 
        b.block_code ILIKE $${paramIndex} OR
        b.description ILIKE $${paramIndex} OR
        t.terminal_name ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Validate sort column
    const allowedSortColumns = ['id', 'block_name', 'block_code', 'block_type', 'created_at', 'updated_at', 'is_active'];
    const validSortBy = allowedSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const validSortOrder = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY b.${validSortBy} ${validSortOrder}`;

    const result = await pool.query(query, params);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows.map(block => formatBlockResponse(block))
    });
  } catch (error) {
    console.error('Error fetching blocks:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// READ - Get single block by ID
export const getBlockById = async (req, res) => {
  try {
    const { id } = req.params;

    const block = await getBlockWithTerminal(id);

    if (!block) {
      return res.status(404).json({
        success: false,
        message: 'Block not found'
      });
    }

    res.status(200).json({
      success: true,
      data: formatBlockResponse(block)
    });
  } catch (error) {
    console.error('Error fetching block:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// READ - Get blocks by terminal
export const getBlocksByTerminal = async (req, res) => {
  try {
    const { terminal_id } = req.params;

    // Check if terminal exists
    const terminalCheck = await pool.query('SELECT id, terminal_name FROM Terminals WHERE id = $1', [terminal_id]);
    if (terminalCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Terminal not found'
      });
    }

    const query = `
      SELECT 
        b.*,
        TO_CHAR(b.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
        TO_CHAR(b.updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at
      FROM Blocks b
      WHERE b.terminal_id = $1
      ORDER BY b.block_name ASC
    `;

    const result = await pool.query(query, [terminal_id]);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      terminal: terminalCheck.rows[0].terminal_name,
      data: result.rows.map(block => ({
        ...block,
        terminal_name: terminalCheck.rows[0].terminal_name
      }))
    });
  } catch (error) {
    console.error('Error fetching blocks by terminal:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// UPDATE - Update block
export const updateBlock = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      terminal_id,
      block_name,
      block_code,
      block_type,
      description,
      is_active
    } = req.body;

    // Check if block exists
    const checkQuery = 'SELECT id, block_name FROM Blocks WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Block not found'
      });
    }

    // Check if terminal exists if terminal_id is being updated
    if (terminal_id !== undefined && terminal_id !== null) {
      const terminalCheck = await pool.query('SELECT id FROM Terminals WHERE id = $1', [terminal_id]);
      if (terminalCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Referenced terminal does not exist'
        });
      }
    }

    // Build dynamic update query
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (terminal_id !== undefined) {
      updates.push(`terminal_id = $${paramIndex}`);
      params.push(terminal_id || null);
      paramIndex++;
    }

    if (block_name !== undefined && block_name.trim() !== '') {
      updates.push(`block_name = $${paramIndex}`);
      params.push(block_name.trim());
      paramIndex++;
    }

    if (block_code !== undefined) {
      if (block_code.trim() === '') {
        // Auto-generate code
        const nameForCode = block_name || checkResult.rows[0].block_name;
        const terminalCode = terminal_id ? await getTerminalCode(terminal_id) : null;
        updates.push(`block_code = $${paramIndex}`);
        params.push(generateBlockCode(nameForCode, terminalCode));
      } else {
        updates.push(`block_code = $${paramIndex}`);
        params.push(block_code.trim());
      }
      paramIndex++;
    }

    if (block_type !== undefined) {
      updates.push(`block_type = $${paramIndex}`);
      params.push(block_type || null);
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
      UPDATE Blocks 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id
    `;

    params.push(id);

    await pool.query(query, params);

    // Fetch updated block with terminal name
    const updatedBlock = await getBlockWithTerminal(id);

    res.status(200).json({
      success: true,
      message: 'Block updated successfully',
      data: formatBlockResponse(updatedBlock)
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Block code already exists'
      });
    }
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Invalid terminal reference'
      });
    }

    console.error('Error updating block:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// DELETE - Hard delete block
export const deleteBlock = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if block exists
    const checkQuery = 'SELECT id, block_name, block_code FROM Blocks WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Block not found'
      });
    }

    const query = 'DELETE FROM Blocks WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);

    res.status(200).json({
      success: true,
      message: `Block "${checkResult.rows[0].block_name}" deleted successfully`,
      data: {
        id: result.rows[0]?.id,
        block_name: checkResult.rows[0].block_name,
        block_code: checkResult.rows[0].block_code
      }
    });
  } catch (error) {
    // Check for foreign key constraints
    if (error.code === '23503') {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete block as it is referenced by other records'
      });
    }

    console.error('Error deleting block:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// SOFT DELETE - Deactivate block
export const deactivateBlock = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      UPDATE Blocks 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_active = true
      RETURNING id
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Block not found or already inactive'
      });
    }

    const updatedBlock = await getBlockWithTerminal(id);

    res.status(200).json({
      success: true,
      message: 'Block deactivated successfully',
      data: formatBlockResponse(updatedBlock)
    });
  } catch (error) {
    console.error('Error deactivating block:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ACTIVATE - Activate block
export const activateBlock = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      UPDATE Blocks 
      SET is_active = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_active = false
      RETURNING id
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Block not found or already active'
      });
    }

    const updatedBlock = await getBlockWithTerminal(id);

    res.status(200).json({
      success: true,
      message: 'Block activated successfully',
      data: formatBlockResponse(updatedBlock)
    });
  } catch (error) {
    console.error('Error activating block:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// BULK OPERATIONS - Bulk create blocks
export const bulkCreateBlocks = async (req, res) => {
  try {
    const { blocks } = req.body;

    if (!Array.isArray(blocks) || blocks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Blocks array is required'
      });
    }

    const results = [];
    const errors = [];

    for (const block of blocks) {
      try {
        if (!block.block_name) {
          errors.push({
            block: block,
            error: 'Block name is required'
          });
          continue;
        }

        // Check terminal if provided
        if (block.terminal_id) {
          const terminalCheck = await pool.query('SELECT id, terminal_code FROM Terminals WHERE id = $1', [block.terminal_id]);
          if (terminalCheck.rows.length === 0) {
            errors.push({
              block_name: block.block_name,
              error: 'Referenced terminal does not exist'
            });
            continue;
          }
        }

        const blockCode = block.block_code || generateBlockCode(
          block.block_name,
          block.terminal_id ? await getTerminalCode(block.terminal_id) : null
        );

        const query = `
          INSERT INTO Blocks (
            terminal_id, block_name, block_code, block_type, description, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, block_name, block_code
        `;

        const values = [
          block.terminal_id || null,
          block.block_name.trim(),
          blockCode,
          block.block_type || null,
          block.description || null,
          block.is_active !== undefined ? block.is_active : true
        ];

        const result = await pool.query(query, values);
        results.push(result.rows[0]);
      } catch (error) {
        errors.push({
          block_name: block.block_name,
          error: error.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully created ${results.length} blocks`,
      data: {
        successful: results,
        failed: errors
      }
    });
  } catch (error) {
    console.error('Error bulk creating blocks:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get block statistics
export const getBlockStats = async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_blocks,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_blocks,
        COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_blocks,
        COUNT(DISTINCT block_type) as unique_types,
        COUNT(DISTINCT terminal_id) as terminals_with_blocks,
        COUNT(CASE WHEN terminal_id IS NOT NULL THEN 1 END) as linked_blocks,
        COUNT(CASE WHEN description IS NOT NULL THEN 1 END) as blocks_with_description
      FROM Blocks
    `;

    const result = await pool.query(query);

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching block stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get block types
export const getBlockTypes = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT block_type, COUNT(*) as count
      FROM Blocks
      WHERE block_type IS NOT NULL
      GROUP BY block_type
      ORDER BY block_type
    `;

    const result = await pool.query(query);

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching block types:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Search blocks with advanced filters
export const searchBlocks = async (req, res) => {
  try {
    const {
      name,
      code,
      type,
      terminal_id,
      is_active,
      created_from,
      created_to
    } = req.query;

    let query = `
      SELECT 
        b.*,
        t.terminal_name,
        TO_CHAR(b.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
        TO_CHAR(b.updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at
      FROM Blocks b
      LEFT JOIN Terminals t ON b.terminal_id = t.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (name) {
      query += ` AND b.block_name ILIKE $${paramIndex}`;
      params.push(`%${name}%`);
      paramIndex++;
    }

    if (code) {
      query += ` AND b.block_code ILIKE $${paramIndex}`;
      params.push(`%${code}%`);
      paramIndex++;
    }

    if (type) {
      query += ` AND b.block_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (terminal_id) {
      query += ` AND b.terminal_id = $${paramIndex}`;
      params.push(terminal_id);
      paramIndex++;
    }

    if (is_active !== undefined) {
      query += ` AND b.is_active = $${paramIndex}`;
      params.push(is_active === 'true');
      paramIndex++;
    }

    if (created_from) {
      query += ` AND b.created_at >= $${paramIndex}`;
      params.push(created_from);
      paramIndex++;
    }

    if (created_to) {
      query += ` AND b.created_at <= $${paramIndex}`;
      params.push(created_to);
      paramIndex++;
    }

    query += ` ORDER BY b.block_name ASC`;

    const result = await pool.query(query, params);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows.map(block => formatBlockResponse(block))
    });
  } catch (error) {
    console.error('Error searching blocks:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};