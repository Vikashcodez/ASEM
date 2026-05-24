import {pool} from '../config/database.js';

const normalizeNullableInt = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsedValue = parseInt(value, 10);
  return Number.isNaN(parsedValue) ? null : parsedValue;
};

// Helper function to format room response
const formatRoomResponse = (room) => {
  return {
    id: room.id,
    terminal_id: room.terminal_id,
    terminal_name: room.terminal_name,
    block_id: room.block_id,
    block_name: room.block_name,
    floor_id: room.floor_id,
    floor_name: room.floor_name,
    floor_number: room.floor_number,
    room_name: room.room_name,
    room_code: room.room_code,
    room_type: room.room_type,
    max_capacity: room.max_capacity,
    current_occupancy: room.current_occupancy,
    available_capacity: (room.max_capacity || 0) - (room.current_occupancy || 0),
    occupancy_percentage: room.max_capacity > 0 
      ? ((room.current_occupancy || 0) / room.max_capacity * 100).toFixed(1)
      : 0,
    room_status: room.room_status,
    description: room.description,
    is_active: room.is_active,
    created_at: room.created_at,
    updated_at: room.updated_at,
    full_location: `${room.terminal_name || 'No Terminal'} > ${room.block_name || 'No Block'} > ${room.floor_name || `Level ${room.floor_number}` || 'No Floor'} > ${room.room_name}`
  };
};

// Helper to get room with all details
const getRoomWithDetails = async (id) => {
  const query = `
    SELECT 
      r.*,
      t.terminal_name,
      t.terminal_code,
      b.block_name,
      b.block_code,
      f.floor_name,
      f.floor_number,
      TO_CHAR(r.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
      TO_CHAR(r.updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at
    FROM Rooms r
    LEFT JOIN Terminals t ON r.terminal_id = t.id
    LEFT JOIN Blocks b ON r.block_id = b.id
    LEFT JOIN Floors f ON r.floor_id = f.id
    WHERE r.id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// Helper to validate relationships
const validateRelationships = async (terminal_id, block_id, floor_id) => {
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
  
  if (floor_id) {
    const floorCheck = await pool.query('SELECT id, terminal_id, block_id FROM Floors WHERE id = $1', [floor_id]);
    if (floorCheck.rows.length === 0) {
      errors.push('Floor does not exist');
    } else {
      if (terminal_id && floorCheck.rows[0].terminal_id !== terminal_id) {
        errors.push('Floor does not belong to the specified terminal');
      }
      if (block_id && floorCheck.rows[0].block_id !== block_id) {
        errors.push('Floor does not belong to the specified block');
      }
    }
  }
  
  return errors;
};

// Helper to generate room code
const generateRoomCode = (roomName, terminalCode, blockCode, floorNumber) => {
  const parts = [];
  if (terminalCode) parts.push(terminalCode);
  if (blockCode) parts.push(blockCode);
  if (floorNumber !== undefined && floorNumber !== null) parts.push(`L${floorNumber}`);
  const code = roomName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .substring(0, 20);
  parts.push(code);
  return parts.join('_');
};

// CREATE - Create a new room
export const createRoom = async (req, res) => {
  try {
    const {
      terminal_id,
      block_id,
      floor_id,
      room_name,
      room_code,
      room_type,
      max_capacity = 0,
      current_occupancy = 0,
      room_status = 'AVAILABLE',
      description,
      is_active = true
    } = req.body;

    const normalizedTerminalId = normalizeNullableInt(terminal_id);
    const normalizedBlockId = normalizeNullableInt(block_id);
    const normalizedFloorId = normalizeNullableInt(floor_id);
    const normalizedMaxCapacity = parseInt(max_capacity, 10) || 0;
    const normalizedCurrentOccupancy = parseInt(current_occupancy, 10) || 0;

    // Validation
    if (!room_name || room_name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Room name is required'
      });
    }

    if (normalizedCurrentOccupancy > normalizedMaxCapacity) {
      return res.status(400).json({
        success: false,
        message: 'Current occupancy cannot exceed maximum capacity'
      });
    }

    // Validate relationships
    const validationErrors = await validateRelationships(normalizedTerminalId, normalizedBlockId, normalizedFloorId);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Generate room code if not provided
    let finalRoomCode = room_code;
    if (!finalRoomCode) {
      const terminalInfo = normalizedTerminalId ? await pool.query('SELECT terminal_code FROM Terminals WHERE id = $1', [normalizedTerminalId]) : { rows: [{}] };
      const blockInfo = normalizedBlockId ? await pool.query('SELECT block_code FROM Blocks WHERE id = $1', [normalizedBlockId]) : { rows: [{}] };
      const floorInfo = normalizedFloorId ? await pool.query('SELECT floor_number FROM Floors WHERE id = $1', [normalizedFloorId]) : { rows: [{}] };
      
      finalRoomCode = generateRoomCode(
        room_name,
        terminalInfo.rows[0]?.terminal_code,
        blockInfo.rows[0]?.block_code,
        floorInfo.rows[0]?.floor_number
      );
    }

    const query = `
      INSERT INTO Rooms (
        terminal_id, block_id, floor_id, room_name, room_code, room_type,
        max_capacity, current_occupancy, room_status, description, is_active,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id
    `;

    const values = [
      normalizedTerminalId,
      normalizedBlockId,
      normalizedFloorId,
      room_name.trim(),
      finalRoomCode,
      room_type || null,
      normalizedMaxCapacity,
      normalizedCurrentOccupancy,
      room_status,
      description || null,
      is_active
    ];

    const result = await pool.query(query, values);
    
    // Fetch complete room details
    const roomWithDetails = await getRoomWithDetails(result.rows[0].id);
    
    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: formatRoomResponse(roomWithDetails)
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Room code already exists'
      });
    }
    
    console.error('Error creating room:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// READ - Get all rooms
export const getAllRooms = async (req, res) => {
  try {
    const {
      terminal_id,
      block_id,
      floor_id,
      room_type,
      room_status,
      is_active,
      search,
      min_capacity,
      max_capacity,
      occupancy_status,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    let query = `
      SELECT 
        r.*,
        t.terminal_name,
        b.block_name,
        f.floor_name,
        f.floor_number,
        TO_CHAR(r.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
        TO_CHAR(r.updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at
      FROM Rooms r
      LEFT JOIN Terminals t ON r.terminal_id = t.id
      LEFT JOIN Blocks b ON r.block_id = b.id
      LEFT JOIN Floors f ON r.floor_id = f.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // Filters
    if (terminal_id) {
      query += ` AND r.terminal_id = $${paramIndex}`;
      params.push(terminal_id);
      paramIndex++;
    }

    if (block_id) {
      query += ` AND r.block_id = $${paramIndex}`;
      params.push(block_id);
      paramIndex++;
    }

    if (floor_id) {
      query += ` AND r.floor_id = $${paramIndex}`;
      params.push(floor_id);
      paramIndex++;
    }

    if (room_type) {
      query += ` AND r.room_type = $${paramIndex}`;
      params.push(room_type);
      paramIndex++;
    }

    if (room_status) {
      query += ` AND r.room_status = $${paramIndex}`;
      params.push(room_status);
      paramIndex++;
    }

    if (is_active !== undefined) {
      query += ` AND r.is_active = $${paramIndex}`;
      params.push(is_active === 'true');
      paramIndex++;
    }

    if (min_capacity) {
      query += ` AND r.max_capacity >= $${paramIndex}`;
      params.push(min_capacity);
      paramIndex++;
    }

    if (max_capacity) {
      query += ` AND r.max_capacity <= $${paramIndex}`;
      params.push(max_capacity);
      paramIndex++;
    }

    if (occupancy_status) {
      if (occupancy_status === 'FULL') {
        query += ` AND r.current_occupancy >= r.max_capacity AND r.max_capacity > 0`;
      } else if (occupancy_status === 'EMPTY') {
        query += ` AND r.current_occupancy = 0`;
      } else if (occupancy_status === 'PARTIAL') {
        query += ` AND r.current_occupancy > 0 AND r.current_occupancy < r.max_capacity`;
      }
    }

    if (search) {
      query += ` AND (
        r.room_name ILIKE $${paramIndex} OR 
        r.room_code ILIKE $${paramIndex} OR
        r.description ILIKE $${paramIndex} OR
        t.terminal_name ILIKE $${paramIndex} OR
        b.block_name ILIKE $${paramIndex} OR
        f.floor_name ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Validate sort column
    const allowedSortColumns = ['id', 'room_name', 'room_code', 'room_type', 'room_status', 'max_capacity', 'current_occupancy', 'created_at', 'updated_at'];
    const validSortBy = allowedSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const validSortOrder = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY r.${validSortBy} ${validSortOrder}`;

    const result = await pool.query(query, params);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows.map(room => formatRoomResponse(room))
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// READ - Get single room by ID
export const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await getRoomWithDetails(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.status(200).json({
      success: true,
      data: formatRoomResponse(room)
    });
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// READ - Get rooms by floor
export const getRoomsByFloor = async (req, res) => {
  try {
    const { floor_id } = req.params;

    const floorCheck = await pool.query('SELECT id, floor_name, floor_number FROM Floors WHERE id = $1', [floor_id]);
    if (floorCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Floor not found'
      });
    }

    const query = `
      SELECT 
        r.*,
        t.terminal_name,
        b.block_name,
        TO_CHAR(r.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
        TO_CHAR(r.updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at
      FROM Rooms r
      LEFT JOIN Terminals t ON r.terminal_id = t.id
      LEFT JOIN Blocks b ON r.block_id = b.id
      WHERE r.floor_id = $1
      ORDER BY r.room_name ASC
    `;

    const result = await pool.query(query, [floor_id]);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      floor: `${floorCheck.rows[0].floor_name} (Level ${floorCheck.rows[0].floor_number})`,
      data: result.rows.map(room => ({
        ...room,
        floor_name: floorCheck.rows[0].floor_name,
        floor_number: floorCheck.rows[0].floor_number
      }))
    });
  } catch (error) {
    console.error('Error fetching rooms by floor:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// READ - Get available rooms
export const getAvailableRooms = async (req, res) => {
  try {
    const { terminal_id, block_id, floor_id, min_capacity } = req.query;

    let query = `
      SELECT 
        r.*,
        t.terminal_name,
        b.block_name,
        f.floor_name,
        f.floor_number,
        (r.max_capacity - r.current_occupancy) as available_capacity,
        TO_CHAR(r.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
        TO_CHAR(r.updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at
      FROM Rooms r
      LEFT JOIN Terminals t ON r.terminal_id = t.id
      LEFT JOIN Blocks b ON r.block_id = b.id
      LEFT JOIN Floors f ON r.floor_id = f.id
      WHERE r.room_status = 'AVAILABLE' 
        AND r.is_active = true
        AND r.current_occupancy < r.max_capacity
    `;
    const params = [];
    let paramIndex = 1;

    if (terminal_id) {
      query += ` AND r.terminal_id = $${paramIndex}`;
      params.push(terminal_id);
      paramIndex++;
    }

    if (block_id) {
      query += ` AND r.block_id = $${paramIndex}`;
      params.push(block_id);
      paramIndex++;
    }

    if (floor_id) {
      query += ` AND r.floor_id = $${paramIndex}`;
      params.push(floor_id);
      paramIndex++;
    }

    if (min_capacity) {
      query += ` AND (r.max_capacity - r.current_occupancy) >= $${paramIndex}`;
      params.push(min_capacity);
      paramIndex++;
    }

    query += ` ORDER BY (r.max_capacity - r.current_occupancy) DESC`;

    const result = await pool.query(query, params);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows.map(room => formatRoomResponse(room))
    });
  } catch (error) {
    console.error('Error fetching available rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// UPDATE - Update room
export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      terminal_id,
      block_id,
      floor_id,
      room_name,
      room_code,
      room_type,
      max_capacity,
      current_occupancy,
      room_status,
      description,
      is_active
    } = req.body;

    const normalizedTerminalId = normalizeNullableInt(terminal_id);
    const normalizedBlockId = normalizeNullableInt(block_id);
    const normalizedFloorId = normalizeNullableInt(floor_id);
    const normalizedMaxCapacity = max_capacity !== undefined ? parseInt(max_capacity, 10) : undefined;
    const normalizedCurrentOccupancy = current_occupancy !== undefined ? parseInt(current_occupancy, 10) : undefined;

    // Check if room exists
    const checkQuery = 'SELECT id, room_name FROM Rooms WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Validate occupancy
    const currentData = await getRoomWithDetails(id);
    const finalMaxCapacity = normalizedMaxCapacity !== undefined ? normalizedMaxCapacity : currentData.max_capacity;
    const finalCurrentOccupancy = normalizedCurrentOccupancy !== undefined ? normalizedCurrentOccupancy : currentData.current_occupancy;
    
    if (finalCurrentOccupancy > finalMaxCapacity) {
      return res.status(400).json({
        success: false,
        message: 'Current occupancy cannot exceed maximum capacity'
      });
    }

    // Validate relationships if provided
    if (terminal_id !== undefined || block_id !== undefined || floor_id !== undefined) {
      const finalTerminalId = terminal_id !== undefined ? normalizedTerminalId : currentData.terminal_id;
      const finalBlockId = block_id !== undefined ? normalizedBlockId : currentData.block_id;
      const finalFloorId = floor_id !== undefined ? normalizedFloorId : currentData.floor_id;
      
      const validationErrors = await validateRelationships(finalTerminalId, finalBlockId, finalFloorId);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      }
    }

    // Build dynamic update query
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (terminal_id !== undefined) {
      updates.push(`terminal_id = $${paramIndex}`);
      params.push(normalizedTerminalId);
      paramIndex++;
    }

    if (block_id !== undefined) {
      updates.push(`block_id = $${paramIndex}`);
      params.push(normalizedBlockId);
      paramIndex++;
    }

    if (floor_id !== undefined) {
      updates.push(`floor_id = $${paramIndex}`);
      params.push(normalizedFloorId);
      paramIndex++;
    }

    if (room_name !== undefined && room_name.trim() !== '') {
      updates.push(`room_name = $${paramIndex}`);
      params.push(room_name.trim());
      paramIndex++;
    }

    if (room_code !== undefined) {
      updates.push(`room_code = $${paramIndex}`);
      params.push(room_code.trim());
      paramIndex++;
    }

    if (room_type !== undefined) {
      updates.push(`room_type = $${paramIndex}`);
      params.push(room_type || null);
      paramIndex++;
    }

    if (max_capacity !== undefined) {
      updates.push(`max_capacity = $${paramIndex}`);
      params.push(normalizedMaxCapacity);
      paramIndex++;
    }

    if (current_occupancy !== undefined) {
      updates.push(`current_occupancy = $${paramIndex}`);
      params.push(normalizedCurrentOccupancy);
      paramIndex++;
    }

    if (room_status !== undefined) {
      updates.push(`room_status = $${paramIndex}`);
      params.push(room_status);
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
      UPDATE Rooms 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id
    `;

    params.push(id);

    await pool.query(query, params);

    // Fetch updated room with details
    const updatedRoom = await getRoomWithDetails(id);

    res.status(200).json({
      success: true,
      message: 'Room updated successfully',
      data: formatRoomResponse(updatedRoom)
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Room code already exists'
      });
    }

    console.error('Error updating room:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// UPDATE - Update room occupancy
export const updateRoomOccupancy = async (req, res) => {
  try {
    const { id } = req.params;
    const { occupancy_change, new_occupancy } = req.body;

    const room = await getRoomWithDetails(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    let finalOccupancy;
    if (new_occupancy !== undefined) {
      finalOccupancy = new_occupancy;
    } else if (occupancy_change !== undefined) {
      finalOccupancy = room.current_occupancy + occupancy_change;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either occupancy_change or new_occupancy is required'
      });
    }

    if (finalOccupancy < 0) {
      return res.status(400).json({
        success: false,
        message: 'Occupancy cannot be negative'
      });
    }

    if (finalOccupancy > room.max_capacity) {
      return res.status(400).json({
        success: false,
        message: `Occupancy cannot exceed maximum capacity of ${room.max_capacity}`
      });
    }

    // Update room status based on occupancy
    let newStatus = room.room_status;
    if (finalOccupancy === 0) {
      newStatus = 'AVAILABLE';
    } else if (finalOccupancy >= room.max_capacity) {
      newStatus = 'OCCUPIED';
    } else {
      newStatus = 'PARTIALLY_OCCUPIED';
    }

    const query = `
      UPDATE Rooms 
      SET current_occupancy = $1, room_status = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id
    `;

    await pool.query(query, [finalOccupancy, newStatus, id]);

    const updatedRoom = await getRoomWithDetails(id);

    res.status(200).json({
      success: true,
      message: 'Room occupancy updated successfully',
      data: formatRoomResponse(updatedRoom)
    });
  } catch (error) {
    console.error('Error updating room occupancy:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// DELETE - Hard delete room
export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const checkQuery = 'SELECT id, room_name, room_code FROM Rooms WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const query = 'DELETE FROM Rooms WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);

    res.status(200).json({
      success: true,
      message: `Room "${checkResult.rows[0].room_name}" (${checkResult.rows[0].room_code}) deleted successfully`,
      data: {
        id: result.rows[0]?.id,
        room_name: checkResult.rows[0].room_name,
        room_code: checkResult.rows[0].room_code
      }
    });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete room as it is referenced by other records'
      });
    }

    console.error('Error deleting room:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// SOFT DELETE - Deactivate room
export const deactivateRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      UPDATE Rooms 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_active = true
      RETURNING id
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Room not found or already inactive'
      });
    }

    const updatedRoom = await getRoomWithDetails(id);

    res.status(200).json({
      success: true,
      message: 'Room deactivated successfully',
      data: formatRoomResponse(updatedRoom)
    });
  } catch (error) {
    console.error('Error deactivating room:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ACTIVATE - Activate room
export const activateRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      UPDATE Rooms 
      SET is_active = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_active = false
      RETURNING id
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Room not found or already active'
      });
    }

    const updatedRoom = await getRoomWithDetails(id);

    res.status(200).json({
      success: true,
      message: 'Room activated successfully',
      data: formatRoomResponse(updatedRoom)
    });
  } catch (error) {
    console.error('Error activating room:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// BULK OPERATIONS - Bulk create rooms
export const bulkCreateRooms = async (req, res) => {
  try {
    const { rooms } = req.body;

    if (!Array.isArray(rooms) || rooms.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Rooms array is required'
      });
    }

    const results = [];
    const errors = [];

    for (const room of rooms) {
      try {
        if (!room.room_name) {
          errors.push({
            room: room,
            error: 'Room name is required'
          });
          continue;
        }

        const validationErrors = await validateRelationships(room.terminal_id, room.block_id, room.floor_id);
        if (validationErrors.length > 0) {
          errors.push({
            room_name: room.room_name,
            error: validationErrors.join(', ')
          });
          continue;
        }

        const query = `
          INSERT INTO Rooms (
            terminal_id, block_id, floor_id, room_name, room_code, room_type,
            max_capacity, current_occupancy, room_status, description, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING id, room_name, room_code
        `;

        const values = [
          room.terminal_id || null,
          room.block_id || null,
          room.floor_id || null,
          room.room_name.trim(),
          room.room_code || null,
          room.room_type || null,
          room.max_capacity || 0,
          room.current_occupancy || 0,
          room.room_status || 'AVAILABLE',
          room.description || null,
          room.is_active !== undefined ? room.is_active : true
        ];

        const result = await pool.query(query, values);
        results.push(result.rows[0]);
      } catch (error) {
        errors.push({
          room_name: room.room_name,
          error: error.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully created ${results.length} rooms`,
      data: {
        successful: results,
        failed: errors
      }
    });
  } catch (error) {
    console.error('Error bulk creating rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get room statistics
export const getRoomStats = async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_rooms,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_rooms,
        COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_rooms,
        COUNT(DISTINCT room_type) as unique_room_types,
        COUNT(DISTINCT terminal_id) as terminals_with_rooms,
        COUNT(DISTINCT block_id) as blocks_with_rooms,
        COUNT(DISTINCT floor_id) as floors_with_rooms,
        SUM(max_capacity) as total_capacity,
        SUM(current_occupancy) as total_occupancy,
        AVG(max_capacity)::numeric(10,2) as avg_capacity,
        SUM(CASE WHEN room_status = 'AVAILABLE' THEN 1 ELSE 0 END) as available_rooms,
        SUM(CASE WHEN room_status = 'OCCUPIED' THEN 1 ELSE 0 END) as occupied_rooms,
        SUM(CASE WHEN room_status = 'PARTIALLY_OCCUPIED' THEN 1 ELSE 0 END) as partially_occupied_rooms,
        SUM(CASE WHEN room_status = 'MAINTENANCE' THEN 1 ELSE 0 END) as maintenance_rooms,
        SUM(CASE WHEN description IS NOT NULL THEN 1 END) as rooms_with_description
      FROM Rooms
    `;

    const result = await pool.query(query);
    const stats = result.rows[0];
    
    // Calculate overall occupancy rate
    stats.overall_occupancy_rate = stats.total_capacity > 0 
      ? ((stats.total_occupancy / stats.total_capacity) * 100).toFixed(1)
      : 0;

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching room stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get room types
export const getRoomTypes = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT room_type, COUNT(*) as count
      FROM Rooms
      WHERE room_type IS NOT NULL
      GROUP BY room_type
      ORDER BY room_type
    `;

    const result = await pool.query(query);

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching room types:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get room status summary
export const getRoomStatusSummary = async (req, res) => {
  try {
    const query = `
      SELECT 
        room_status,
        COUNT(*) as count,
        SUM(max_capacity) as total_capacity,
        SUM(current_occupancy) as current_occupancy,
        AVG(max_capacity)::numeric(10,2) as avg_capacity
      FROM Rooms
      WHERE is_active = true
      GROUP BY room_status
      ORDER BY 
        CASE room_status
          WHEN 'AVAILABLE' THEN 1
          WHEN 'PARTIALLY_OCCUPIED' THEN 2
          WHEN 'OCCUPIED' THEN 3
          WHEN 'MAINTENANCE' THEN 4
          ELSE 5
        END
    `;

    const result = await pool.query(query);

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching room status summary:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get complete hierarchy: Terminals -> Blocks -> Floors -> Rooms
export const getFullHierarchy = async (req, res) => {
    try {
        const query = `
            SELECT 
                t.id AS terminal_id,
                t.terminal_name,
                t.terminal_code,
                t.description AS terminal_description,
                t.is_active AS terminal_is_active,
                COALESCE(
                    JSONB_AGG(
                    JSONB_BUILD_OBJECT(
                            'block_id', b.id,
                            'block_name', b.block_name,
                            'block_code', b.block_code,
                            'block_type', b.block_type,
                            'description', b.description,
                            'is_active', b.is_active,
                            'floors', COALESCE(
                                (
                                    SELECT JSONB_AGG(
                                        JSONB_BUILD_OBJECT(
                                            'floor_id', f.id,
                                            'floor_name', f.floor_name,
                                            'floor_number', f.floor_number,
                                            'description', f.description,
                                            'is_active', f.is_active,
                                            'rooms', COALESCE(
                                                (
                                                    SELECT JSONB_AGG(
                                                        JSONB_BUILD_OBJECT(
                                                            'room_id', r.id,
                                                            'room_name', r.room_name,
                                                            'room_code', r.room_code,
                                                            'room_type', r.room_type,
                                                            'max_capacity', r.max_capacity,
                                                            'current_occupancy', r.current_occupancy,
                                                            'room_status', r.room_status,
                                                            'description', r.description,
                                                            'is_active', r.is_active,
                                                            'created_at', r.created_at,
                                                            'updated_at', r.updated_at
                                                        )
                                                        ORDER BY r.room_name
                                                    )
                                                    FROM Rooms r
                                                    WHERE r.floor_id = f.id 
                                                    AND r.is_active = true
                                                ),
                                                '[]'::jsonb
                                            )
                                        )
                                        ORDER BY f.floor_number
                                    )
                                    FROM Floors f
                                    WHERE f.block_id = b.id 
                                    AND f.is_active = true
                                ),
                                '[]'::jsonb
                            )
                        )
                        ORDER BY b.block_name
                    ) FILTER (WHERE b.id IS NOT NULL),
                    '[]'::jsonb
                ) AS blocks
            FROM Terminals t
            LEFT JOIN Blocks b ON b.terminal_id = t.id AND b.is_active = true
            WHERE t.is_active = true
            GROUP BY t.id
            ORDER BY t.terminal_name
        `;

        const result = await pool.query(query);
        
        res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching hierarchy:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching hierarchy',
            error: error.message
        });
    }
};

// Get hierarchy for a specific terminal
export const getTerminalHierarchy = async (req, res) => {
    try {
        const { terminalId } = req.params;
        
        const query = `
            SELECT 
                t.id AS terminal_id,
                t.terminal_name,
                t.terminal_code,
                t.description AS terminal_description,
                t.is_active AS terminal_is_active,
                COALESCE(
                    JSONB_AGG(
                    JSONB_BUILD_OBJECT(
                            'block_id', b.id,
                            'block_name', b.block_name,
                            'block_code', b.block_code,
                            'block_type', b.block_type,
                            'description', b.description,
                            'is_active', b.is_active,
                            'floors', COALESCE(
                                (
                                    SELECT JSONB_AGG(
                                        JSONB_BUILD_OBJECT(
                                            'floor_id', f.id,
                                            'floor_name', f.floor_name,
                                            'floor_number', f.floor_number,
                                            'description', f.description,
                                            'is_active', f.is_active,
                                            'rooms', COALESCE(
                                                (
                                                    SELECT JSONB_AGG(
                                                        JSONB_BUILD_OBJECT(
                                                            'room_id', r.id,
                                                            'room_name', r.room_name,
                                                            'room_code', r.room_code,
                                                            'room_type', r.room_type,
                                                            'max_capacity', r.max_capacity,
                                                            'current_occupancy', r.current_occupancy,
                                                            'room_status', r.room_status,
                                                            'description', r.description,
                                                            'is_active', r.is_active,
                                                            'created_at', r.created_at,
                                                            'updated_at', r.updated_at
                                                        )
                                                        ORDER BY r.room_name
                                                    )
                                                    FROM Rooms r
                                                    WHERE r.floor_id = f.id 
                                                    AND r.is_active = true
                                                ),
                                                '[]'::jsonb
                                            )
                                        )
                                        ORDER BY f.floor_number
                                    )
                                    FROM Floors f
                                    WHERE f.block_id = b.id 
                                    AND f.is_active = true
                                ),
                                '[]'::jsonb
                            )
                        )
                        ORDER BY b.block_name
                    ) FILTER (WHERE b.id IS NOT NULL),
                    '[]'::jsonb
                ) AS blocks
            FROM Terminals t
            LEFT JOIN Blocks b ON b.terminal_id = t.id AND b.is_active = true
            WHERE t.id = $1 AND t.is_active = true
            GROUP BY t.id
        `;
        
        const result = await pool.query(query, [terminalId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Terminal not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching terminal hierarchy:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching terminal hierarchy',
            error: error.message
        });
    }
};

// Get simplified hierarchy (only IDs and names)
export const getSimplifiedHierarchy = async (req, res) => {
    try {
        const query = `
            SELECT 
                t.id AS terminal_id,
                t.terminal_name,
                (
                    SELECT JSONB_AGG(
                        JSONB_BUILD_OBJECT(
                            'block_id', b.id,
                            'block_name', b.block_name,
                            'floors', (
                                SELECT JSONB_AGG(
                                    JSONB_BUILD_OBJECT(
                                        'floor_id', f.id,
                                        'floor_name', f.floor_name,
                                        'floor_number', f.floor_number,
                                        'rooms', (
                                            SELECT JSONB_AGG(
                                                JSONB_BUILD_OBJECT(
                                                    'room_id', r.id,
                                                    'room_name', r.room_name,
                                                    'room_code', r.room_code
                                                )
                                                ORDER BY r.room_name
                                            )
                                            FROM Rooms r
                                            WHERE r.floor_id = f.id AND r.is_active = true
                                        )
                                    )
                                    ORDER BY f.floor_number
                                )
                                FROM Floors f
                                WHERE f.block_id = b.id AND f.is_active = true
                            )
                        )
                        ORDER BY b.block_name
                    )
                    FROM Blocks b
                    WHERE b.terminal_id = t.id AND b.is_active = true
                ) AS blocks
            FROM Terminals t
            WHERE t.is_active = true
            ORDER BY t.terminal_name
        `;
        
        const result = await pool.query(query);
        
        res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching simplified hierarchy:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching simplified hierarchy',
            error: error.message
        });
    }
};

// Get all rooms with their full parent hierarchy
export const getAllRoomsWithHierarchy = async (req, res) => {
    try {
        const query = `
            SELECT 
                r.id AS room_id,
                r.room_name,
                r.room_code,
                r.room_type,
                r.max_capacity,
                r.current_occupancy,
                r.room_status,
                r.description AS room_description,
                r.is_active AS room_is_active,
                jsonb_build_object(
                    'floor_id', f.id,
                    'floor_name', f.floor_name,
                    'floor_number', f.floor_number,
                    'block_id', b.id,
                    'block_name', b.block_name,
                    'block_code', b.block_code,
                    'terminal_id', t.id,
                    'terminal_name', t.terminal_name,
                    'terminal_code', t.terminal_code
                ) AS parent_hierarchy
            FROM Rooms r
            JOIN Floors f ON r.floor_id = f.id
            JOIN Blocks b ON r.block_id = b.id
            JOIN Terminals t ON r.terminal_id = t.id
            WHERE r.is_active = true
            ORDER BY t.terminal_name, b.block_name, f.floor_number, r.room_name
        `;
        
        const result = await pool.query(query);
        
        res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching rooms with hierarchy:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching rooms with hierarchy',
            error: error.message
        });
    }
};