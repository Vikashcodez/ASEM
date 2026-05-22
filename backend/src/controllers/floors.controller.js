import {pool} from '../config/database.js';

// Helper function to format floor response
const formatFloorResponse = (floor) => {
  return {
    id: floor.id,
    terminal_id: floor.terminal_id,
    terminal_name: floor.terminal_name,
    block_id: floor.block_id,
    block_name: floor.block_name,
    floor_name: floor.floor_name,
    floor_number: floor.floor_number,
    description: floor.description,
    is_active: floor.is_active,
    created_at: floor.created_at,
    updated_at: floor.updated_at,
    full_location: `${floor.terminal_name || 'No Terminal'} > ${floor.block_name || 'No Block'} > ${floor.floor_name}`
  };
};

// Helper to get floor with terminal and block names
const getFloorWithDetails = async (id) => {
  const query = `
    SELECT 
      f.*,
      t.terminal_name,
      t.terminal_code,
      b.block_name,
      b.block_code,
      TO_CHAR(f.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
      TO_CHAR(f.updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at
    FROM Floors f
    LEFT JOIN Terminals t ON f.terminal_id = t.id
    LEFT JOIN Blocks b ON f.block_id = b.id
    WHERE f.id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// Helper to validate relationships
const validateRelationships = async (terminal_id, block_id) => {
  const errors = [];
  
  if (terminal_id) {
    const terminalCheck = await pool.query('SELECT id FROM Terminals WHERE id = $1', [terminal_id]);
    if (terminalCheck.rows.length === 0) {
      errors.push('Terminal does not exist');
    }
  }
  
  if (block_id) {
    const blockCheck = await pool.query('SELECT id, terminal_id FROM Blocks WHERE id = $1', [block_id]);
    if (blockCheck.rows.length === 0) {
      errors.push('Block does not exist');
    } else if (terminal_id && blockCheck.rows[0].terminal_id !== terminal_id) {
      errors.push('Block does not belong to the specified terminal');
    }
  }
  
  return errors;
};

// CREATE - Create a new floor
export const createFloor = async (req, res) => {
  try {
    const {
      terminal_id,
      block_id,
      floor_name,
      floor_number,
      description,
      is_active = true
    } = req.body;

    // Validation
    if (!floor_name || floor_name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Floor name is required'
      });
    }

    if (floor_number === undefined || floor_number === null) {
      return res.status(400).json({
        success: false,
        message: 'Floor number is required'
      });
    }

    // Validate relationships
    const validationErrors = await validateRelationships(terminal_id, block_id);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Check for duplicate floor number in same block or terminal
    let duplicateCheck = '';
    let duplicateParams = [];
    
    if (block_id) {
      duplicateCheck = 'SELECT id FROM Floors WHERE block_id = $1 AND floor_number = $2';
      duplicateParams = [block_id, floor_number];
    } else if (terminal_id) {
      duplicateCheck = 'SELECT id FROM Floors WHERE terminal_id = $1 AND floor_number = $2 AND block_id IS NULL';
      duplicateParams = [terminal_id, floor_number];
    }
    
    if (duplicateCheck) {
      const duplicateResult = await pool.query(duplicateCheck, duplicateParams);
      if (duplicateResult.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Floor number ${floor_number} already exists in this location`
        });
      }
    }

    const query = `
      INSERT INTO Floors (
        terminal_id, block_id, floor_name, floor_number, 
        description, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id
    `;

    const values = [
      terminal_id || null,
      block_id || null,
      floor_name.trim(),
      floor_number,
      description || null,
      is_active
    ];

    const result = await pool.query(query, values);
    
    // Fetch complete floor details
    const floorWithDetails = await getFloorWithDetails(result.rows[0].id);
    
    res.status(201).json({
      success: true,
      message: 'Floor created successfully',
      data: formatFloorResponse(floorWithDetails)
    });
  } catch (error) {
    console.error('Error creating floor:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// READ - Get all floors
export const getAllFloors = async (req, res) => {
  try {
    const {
      terminal_id,
      block_id,
      is_active,
      search,
      min_floor,
      max_floor,
      sort_by = 'floor_number',
      sort_order = 'ASC'
    } = req.query;

    let query = `
      SELECT 
        f.*,
        t.terminal_name,
        b.block_name,
        TO_CHAR(f.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
        TO_CHAR(f.updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at
      FROM Floors f
      LEFT JOIN Terminals t ON f.terminal_id = t.id
      LEFT JOIN Blocks b ON f.block_id = b.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // Filter by terminal
    if (terminal_id) {
      query += ` AND f.terminal_id = $${paramIndex}`;
      params.push(terminal_id);
      paramIndex++;
    }

    // Filter by block
    if (block_id) {
      query += ` AND f.block_id = $${paramIndex}`;
      params.push(block_id);
      paramIndex++;
    }

    // Filter by active status
    if (is_active !== undefined) {
      query += ` AND f.is_active = $${paramIndex}`;
      params.push(is_active === 'true');
      paramIndex++;
    }

    // Filter by floor number range
    if (min_floor !== undefined) {
      query += ` AND f.floor_number >= $${paramIndex}`;
      params.push(min_floor);
      paramIndex++;
    }

    if (max_floor !== undefined) {
      query += ` AND f.floor_number <= $${paramIndex}`;
      params.push(max_floor);
      paramIndex++;
    }

    // Search by floor name or description
    if (search) {
      query += ` AND (
        f.floor_name ILIKE $${paramIndex} OR 
        f.description ILIKE $${paramIndex} OR
        t.terminal_name ILIKE $${paramIndex} OR
        b.block_name ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Validate sort column
    const allowedSortColumns = ['id', 'floor_name', 'floor_number', 'created_at', 'updated_at', 'is_active'];
    const validSortBy = allowedSortColumns.includes(sort_by) ? sort_by : 'floor_number';
    const validSortOrder = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY f.${validSortBy} ${validSortOrder}`;

    const result = await pool.query(query, params);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows.map(floor => formatFloorResponse(floor))
    });
  } catch (error) {
    console.error('Error fetching floors:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// READ - Get single floor by ID
export const getFloorById = async (req, res) => {
  try {
    const { id } = req.params;

    const floor = await getFloorWithDetails(id);

    if (!floor) {
      return res.status(404).json({
        success: false,
        message: 'Floor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: formatFloorResponse(floor)
    });
  } catch (error) {
    console.error('Error fetching floor:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// READ - Get floors by terminal
export const getFloorsByTerminal = async (req, res) => {
  try {
    const { terminal_id } = req.params;

    const terminalCheck = await pool.query('SELECT id, terminal_name FROM Terminals WHERE id = $1', [terminal_id]);
    if (terminalCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Terminal not found'
      });
    }

    const query = `
      SELECT 
        f.*,
        b.block_name,
        TO_CHAR(f.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
        TO_CHAR(f.updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at
      FROM Floors f
      LEFT JOIN Blocks b ON f.block_id = b.id
      WHERE f.terminal_id = $1
      ORDER BY f.floor_number ASC, f.floor_name ASC
    `;

    const result = await pool.query(query, [terminal_id]);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      terminal: terminalCheck.rows[0].terminal_name,
      data: result.rows.map(floor => ({
        ...floor,
        terminal_name: terminalCheck.rows[0].terminal_name
      }))
    });
  } catch (error) {
    console.error('Error fetching floors by terminal:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// READ - Get floors by block
export const getFloorsByBlock = async (req, res) => {
  try {
    const { block_id } = req.params;

    const blockCheck = await pool.query(`
      SELECT b.id, b.block_name, t.terminal_name 
      FROM Blocks b
      LEFT JOIN Terminals t ON b.terminal_id = t.id
      WHERE b.id = $1
    `, [block_id]);
    
    if (blockCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Block not found'
      });
    }

    const query = `
      SELECT 
        f.*,
        TO_CHAR(f.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
        TO_CHAR(f.updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at
      FROM Floors f
      WHERE f.block_id = $1
      ORDER BY f.floor_number ASC
    `;

    const result = await pool.query(query, [block_id]);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      block: blockCheck.rows[0].block_name,
      terminal: blockCheck.rows[0].terminal_name,
      data: result.rows.map(floor => ({
        ...floor,
        block_name: blockCheck.rows[0].block_name,
        terminal_name: blockCheck.rows[0].terminal_name
      }))
    });
  } catch (error) {
    console.error('Error fetching floors by block:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// UPDATE - Update floor
export const updateFloor = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      terminal_id,
      block_id,
      floor_name,
      floor_number,
      description,
      is_active
    } = req.body;

    // Check if floor exists
    const checkQuery = 'SELECT id, floor_name, floor_number FROM Floors WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Floor not found'
      });
    }

    // Validate relationships if provided
    if (terminal_id !== undefined || block_id !== undefined) {
      const finalTerminalId = terminal_id !== undefined ? terminal_id : (await getFloorTerminalId(id));
      const finalBlockId = block_id !== undefined ? block_id : (await getFloorBlockId(id));
      
      const validationErrors = await validateRelationships(finalTerminalId, finalBlockId);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      }
    }

    // Check for duplicate floor number
    if (floor_number !== undefined) {
      const currentFloor = checkResult.rows[0];
      const finalBlockId = block_id !== undefined ? block_id : (await getFloorBlockId(id));
      const finalTerminalId = terminal_id !== undefined ? terminal_id : (await getFloorTerminalId(id));
      
      let duplicateCheck = '';
      let duplicateParams = [];
      
      if (finalBlockId) {
        duplicateCheck = 'SELECT id FROM Floors WHERE block_id = $1 AND floor_number = $2 AND id != $3';
        duplicateParams = [finalBlockId, floor_number, id];
      } else if (finalTerminalId) {
        duplicateCheck = 'SELECT id FROM Floors WHERE terminal_id = $1 AND floor_number = $2 AND block_id IS NULL AND id != $3';
        duplicateParams = [finalTerminalId, floor_number, id];
      }
      
      if (duplicateCheck) {
        const duplicateResult = await pool.query(duplicateCheck, duplicateParams);
        if (duplicateResult.rows.length > 0) {
          return res.status(409).json({
            success: false,
            message: `Floor number ${floor_number} already exists in this location`
          });
        }
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

    if (block_id !== undefined) {
      updates.push(`block_id = $${paramIndex}`);
      params.push(block_id || null);
      paramIndex++;
    }

    if (floor_name !== undefined && floor_name.trim() !== '') {
      updates.push(`floor_name = $${paramIndex}`);
      params.push(floor_name.trim());
      paramIndex++;
    }

    if (floor_number !== undefined) {
      updates.push(`floor_number = $${paramIndex}`);
      params.push(floor_number);
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
      UPDATE Floors 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id
    `;

    params.push(id);

    await pool.query(query, params);

    // Fetch updated floor with details
    const updatedFloor = await getFloorWithDetails(id);

    res.status(200).json({
      success: true,
      message: 'Floor updated successfully',
      data: formatFloorResponse(updatedFloor)
    });
  } catch (error) {
    console.error('Error updating floor:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Helper functions for update
const getFloorTerminalId = async (id) => {
  const result = await pool.query('SELECT terminal_id FROM Floors WHERE id = $1', [id]);
  return result.rows[0]?.terminal_id;
};

const getFloorBlockId = async (id) => {
  const result = await pool.query('SELECT block_id FROM Floors WHERE id = $1', [id]);
  return result.rows[0]?.block_id;
};

// DELETE - Hard delete floor
export const deleteFloor = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if floor exists
    const checkQuery = 'SELECT id, floor_name, floor_number FROM Floors WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Floor not found'
      });
    }

    const query = 'DELETE FROM Floors WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);

    res.status(200).json({
      success: true,
      message: `Floor "${checkResult.rows[0].floor_name}" (Level ${checkResult.rows[0].floor_number}) deleted successfully`,
      data: {
        id: result.rows[0]?.id,
        floor_name: checkResult.rows[0].floor_name,
        floor_number: checkResult.rows[0].floor_number
      }
    });
  } catch (error) {
    // Check for foreign key constraints
    if (error.code === '23503') {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete floor as it is referenced by other records'
      });
    }

    console.error('Error deleting floor:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// SOFT DELETE - Deactivate floor
export const deactivateFloor = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      UPDATE Floors 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_active = true
      RETURNING id
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Floor not found or already inactive'
      });
    }

    const updatedFloor = await getFloorWithDetails(id);

    res.status(200).json({
      success: true,
      message: 'Floor deactivated successfully',
      data: formatFloorResponse(updatedFloor)
    });
  } catch (error) {
    console.error('Error deactivating floor:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ACTIVATE - Activate floor
export const activateFloor = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      UPDATE Floors 
      SET is_active = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_active = false
      RETURNING id
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Floor not found or already active'
      });
    }

    const updatedFloor = await getFloorWithDetails(id);

    res.status(200).json({
      success: true,
      message: 'Floor activated successfully',
      data: formatFloorResponse(updatedFloor)
    });
  } catch (error) {
    console.error('Error activating floor:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// BULK OPERATIONS - Bulk create floors
export const bulkCreateFloors = async (req, res) => {
  try {
    const { floors } = req.body;

    if (!Array.isArray(floors) || floors.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Floors array is required'
      });
    }

    const results = [];
    const errors = [];

    for (const floor of floors) {
      try {
        if (!floor.floor_name || floor.floor_number === undefined) {
          errors.push({
            floor: floor,
            error: 'Floor name and number are required'
          });
          continue;
        }

        // Validate relationships
        const validationErrors = await validateRelationships(floor.terminal_id, floor.block_id);
        if (validationErrors.length > 0) {
          errors.push({
            floor_name: floor.floor_name,
            error: validationErrors.join(', ')
          });
          continue;
        }

        const query = `
          INSERT INTO Floors (
            terminal_id, block_id, floor_name, floor_number, description, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, floor_name, floor_number
        `;

        const values = [
          floor.terminal_id || null,
          floor.block_id || null,
          floor.floor_name.trim(),
          floor.floor_number,
          floor.description || null,
          floor.is_active !== undefined ? floor.is_active : true
        ];

        const result = await pool.query(query, values);
        results.push(result.rows[0]);
      } catch (error) {
        errors.push({
          floor_name: floor.floor_name,
          error: error.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully created ${results.length} floors`,
      data: {
        successful: results,
        failed: errors
      }
    });
  } catch (error) {
    console.error('Error bulk creating floors:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get floor statistics
export const getFloorStats = async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_floors,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_floors,
        COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_floors,
        COUNT(DISTINCT terminal_id) as terminals_with_floors,
        COUNT(DISTINCT block_id) as blocks_with_floors,
        COUNT(CASE WHEN block_id IS NOT NULL THEN 1 END) as floors_in_blocks,
        COUNT(CASE WHEN terminal_id IS NOT NULL AND block_id IS NULL THEN 1 END) as floors_direct_in_terminals,
        MIN(floor_number) as lowest_floor,
        MAX(floor_number) as highest_floor,
        AVG(floor_number)::numeric(10,2) as avg_floor_number,
        COUNT(CASE WHEN description IS NOT NULL THEN 1 END) as floors_with_description
      FROM Floors
    `;

    const result = await pool.query(query);

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching floor stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get floors by level range
export const getFloorsByLevelRange = async (req, res) => {
  try {
    const { min, max } = req.params;

    const query = `
      SELECT 
        f.*,
        t.terminal_name,
        b.block_name,
        TO_CHAR(f.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
        TO_CHAR(f.updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at
      FROM Floors f
      LEFT JOIN Terminals t ON f.terminal_id = t.id
      LEFT JOIN Blocks b ON f.block_id = b.id
      WHERE f.floor_number BETWEEN $1 AND $2
      ORDER BY f.floor_number ASC
    `;

    const result = await pool.query(query, [min, max]);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      range: { min: parseInt(min), max: parseInt(max) },
      data: result.rows.map(floor => formatFloorResponse(floor))
    });
  } catch (error) {
    console.error('Error fetching floors by range:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get floor hierarchy
export const getFloorHierarchy = async (req, res) => {
  try {
    const query = `
      SELECT 
        t.id as terminal_id,
        t.terminal_name,
        t.terminal_code,
        json_agg(DISTINCT jsonb_build_object(
          'block_id', b.id,
          'block_name', b.block_name,
          'block_code', b.block_code,
          'floors', (
            SELECT json_agg(jsonb_build_object(
              'id', f.id,
              'floor_name', f.floor_name,
              'floor_number', f.floor_number,
              'description', f.description,
              'is_active', f.is_active
            ) ORDER BY f.floor_number ASC)
            FROM Floors f
            WHERE f.block_id = b.id
          )
        )) FILTER (WHERE b.id IS NOT NULL) as blocks,
        (
          SELECT json_agg(jsonb_build_object(
            'id', f.id,
            'floor_name', f.floor_name,
            'floor_number', f.floor_number,
            'description', f.description,
            'is_active', f.is_active
          ) ORDER BY f.floor_number ASC)
          FROM Floors f
          WHERE f.terminal_id = t.id AND f.block_id IS NULL
        ) as direct_floors
      FROM Terminals t
      LEFT JOIN Blocks b ON b.terminal_id = t.id
      LEFT JOIN Floors f ON f.terminal_id = t.id
      GROUP BY t.id, t.terminal_name, t.terminal_code
      ORDER BY t.terminal_name
    `;

    const result = await pool.query(query);

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching floor hierarchy:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};