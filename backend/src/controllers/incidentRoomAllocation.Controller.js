// controllers/incidentRoomAllocationController.js
import client from '../config/database.js'; // Adjust path to your database client

// ==================== DISPLAY FUNCTIONS ====================

// Get all room allocations
export const getAllRoomAllocations = async (req, res) => {
    try {
        const result = await client.query(`
            SELECT 
                ira.id,
                ira.incident_id,
                ira.room_id,
                ira.no_of_people,
                ira.note,
                ira.allocated_at,
                ira.allocated_by,
                ira.deallocated_at,
                i.incident_code,
                i.incident_title,
                i.severity_level,
                r.room_number,
                r.room_type,
                e.name as allocated_by_name
            FROM Incident_Room_Allocations ira
            LEFT JOIN Incidents i ON ira.incident_id = i.id
            LEFT JOIN Rooms r ON ira.room_id = r.id
            LEFT JOIN employees e ON ira.allocated_by = e.id
            ORDER BY ira.allocated_at DESC
        `);

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching room allocations:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get room allocation by ID
export const getRoomAllocationById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await client.query(`
            SELECT 
                ira.id,
                ira.incident_id,
                ira.room_id,
                ira.no_of_people,
                ira.note,
                ira.allocated_at,
                ira.allocated_by,
                ira.deallocated_at,
                i.incident_code,
                i.incident_title,
                i.incident_type,
                i.severity_level,
                i.incident_status,
                r.room_number,
                r.room_type,
                r.floor,
                e.name as allocated_by_name
            FROM Incident_Room_Allocations ira
            LEFT JOIN Incidents i ON ira.incident_id = i.id
            LEFT JOIN Rooms r ON ira.room_id = r.id
            LEFT JOIN employees e ON ira.allocated_by = e.id
            WHERE ira.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Room allocation not found'
            });
        }

        res.status(200).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching room allocation:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get allocations by incident ID
export const getAllocationsByIncidentId = async (req, res) => {
    try {
        const { incidentId } = req.params;
        
        const result = await client.query(`
            SELECT 
                ira.id,
                ira.incident_id,
                ira.room_id,
                ira.no_of_people,
                ira.note,
                ira.allocated_at,
                ira.allocated_by,
                ira.deallocated_at,
                r.room_number,
                r.room_type,
                r.floor,
                e.name as allocated_by_name
            FROM Incident_Room_Allocations ira
            LEFT JOIN Rooms r ON ira.room_id = r.id
            LEFT JOIN employees e ON ira.allocated_by = e.id
            WHERE ira.incident_id = $1
            AND ira.deallocated_at IS NULL
            ORDER BY ira.allocated_at DESC
        `, [incidentId]);

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching incident allocations:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get active allocations (not deallocated)
export const getActiveAllocations = async (req, res) => {
    try {
        const result = await client.query(`
            SELECT 
                ira.id,
                ira.incident_id,
                ira.room_id,
                ira.no_of_people,
                ira.note,
                ira.allocated_at,
                ira.allocated_by,
                ira.deallocated_at,
                i.incident_code,
                i.incident_title,
                i.severity_level,
                r.room_number,
                r.room_type,
                e.name as allocated_by_name
            FROM Incident_Room_Allocations ira
            LEFT JOIN Incidents i ON ira.incident_id = i.id
            LEFT JOIN Rooms r ON ira.room_id = r.id
            LEFT JOIN employees e ON ira.allocated_by = e.id
            WHERE ira.deallocated_at IS NULL
            ORDER BY ira.allocated_at DESC
        `);

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching active allocations:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// ==================== CREATE FUNCTIONS ====================

// Create new room allocation
export const createRoomAllocation = async (req, res) => {
    try {
        const {
            incident_id,
            room_id,
            no_of_people = 0,
            note,
            allocated_by
        } = req.body;

        // Validate required fields
        if (!incident_id || !room_id) {
            return res.status(400).json({
                success: false,
                message: 'incident_id and room_id are required'
            });
        }

        // Check if incident exists and is active
        const incidentCheck = await client.query(
            'SELECT id, is_active, is_room_allocated FROM Incidents WHERE id = $1',
            [incident_id]
        );

        if (incidentCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Incident not found'
            });
        }

        // Check if room exists and is available
        const roomCheck = await client.query(
            'SELECT id FROM Rooms WHERE id = $1',
            [room_id]
        );

        if (roomCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Check if room is already allocated to another active incident
        const activeAllocationCheck = await client.query(`
            SELECT id FROM Incident_Room_Allocations 
            WHERE room_id = $1 AND deallocated_at IS NULL
        `, [room_id]);

        if (activeAllocationCheck.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Room is already allocated to another incident'
            });
        }

        // Start transaction
        await client.query('BEGIN');

        // Create allocation
        const result = await client.query(`
            INSERT INTO Incident_Room_Allocations (
                incident_id, room_id, no_of_people, note, allocated_by
            ) VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [incident_id, room_id, no_of_people, note, allocated_by]);

        // Update incident's is_room_allocated flag
        await client.query(`
            UPDATE Incidents 
            SET is_room_allocated = TRUE, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [incident_id]);

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Room allocation created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating room allocation:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// ==================== EDIT FUNCTIONS ====================

// Update room allocation
export const updateRoomAllocation = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            room_id,
            no_of_people,
            note,
            allocated_by
        } = req.body;

        // Check if allocation exists
        const existingAllocation = await client.query(
            'SELECT * FROM Incident_Room_Allocations WHERE id = $1 AND deallocated_at IS NULL',
            [id]
        );

        if (existingAllocation.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Room allocation not found or already deallocated'
            });
        }

        // If room is being changed, check if new room is available
        if (room_id && room_id !== existingAllocation.rows[0].room_id) {
            const roomCheck = await client.query(
                'SELECT id FROM Rooms WHERE id = $1',
                [room_id]
            );

            if (roomCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'New room not found'
                });
            }

            const activeAllocationCheck = await client.query(`
                SELECT id FROM Incident_Room_Allocations 
                WHERE room_id = $1 AND deallocated_at IS NULL AND id != $2
            `, [room_id, id]);

            if (activeAllocationCheck.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'New room is already allocated to another incident'
                });
            }
        }

        // Build update query dynamically
        const updates = [];
        const values = [];
        let paramCounter = 1;

        if (room_id !== undefined) {
            updates.push(`room_id = $${paramCounter++}`);
            values.push(room_id);
        }
        if (no_of_people !== undefined) {
            updates.push(`no_of_people = $${paramCounter++}`);
            values.push(no_of_people);
        }
        if (note !== undefined) {
            updates.push(`note = $${paramCounter++}`);
            values.push(note);
        }
        if (allocated_by !== undefined) {
            updates.push(`allocated_by = $${paramCounter++}`);
            values.push(allocated_by);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        values.push(id);
        const query = `
            UPDATE Incident_Room_Allocations 
            SET ${updates.join(', ')}
            WHERE id = $${paramCounter}
            RETURNING *
        `;

        const result = await client.query(query, values);

        res.status(200).json({
            success: true,
            message: 'Room allocation updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating room allocation:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Deallocate room (soft delete)
export const deallocateRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const { deallocated_by } = req.body;

        // Check if allocation exists and is active
        const existingAllocation = await client.query(`
            SELECT incident_id FROM Incident_Room_Allocations 
            WHERE id = $1 AND deallocated_at IS NULL
        `, [id]);

        if (existingAllocation.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Room allocation not found or already deallocated'
            });
        }

        const incidentId = existingAllocation.rows[0].incident_id;

        // Start transaction
        await client.query('BEGIN');

        // Deallocate the room
        const result = await client.query(`
            UPDATE Incident_Room_Allocations 
            SET deallocated_at = CURRENT_TIMESTAMP,
                allocated_by = COALESCE($1, allocated_by)
            WHERE id = $2
            RETURNING *
        `, [deallocated_by, id]);

        // Check if incident has any other active room allocations
        const activeAllocations = await client.query(`
            SELECT COUNT(*) as count FROM Incident_Room_Allocations 
            WHERE incident_id = $1 AND deallocated_at IS NULL
        `, [incidentId]);

        // If no active allocations, update incident flag
        if (parseInt(activeAllocations.rows[0].count) === 0) {
            await client.query(`
                UPDATE Incidents 
                SET is_room_allocated = FALSE, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [incidentId]);
        }

        await client.query('COMMIT');

        res.status(200).json({
            success: true,
            message: 'Room deallocated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deallocating room:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// ==================== DELETE FUNCTION (Hard delete) ====================

// Delete room allocation permanently
export const deleteRoomAllocation = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if allocation exists
        const existingAllocation = await client.query(
            'SELECT incident_id FROM Incident_Room_Allocations WHERE id = $1',
            [id]
        );

        if (existingAllocation.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Room allocation not found'
            });
        }

        const incidentId = existingAllocation.rows[0].incident_id;

        // Start transaction
        await client.query('BEGIN');

        // Delete the allocation
        await client.query('DELETE FROM Incident_Room_Allocations WHERE id = $1', [id]);

        // Check if incident has any other room allocations
        const remainingAllocations = await client.query(`
            SELECT COUNT(*) as count FROM Incident_Room_Allocations 
            WHERE incident_id = $1
        `, [incidentId]);

        // If no allocations left, update incident flag
        if (parseInt(remainingAllocations.rows[0].count) === 0) {
            await client.query(`
                UPDATE Incidents 
                SET is_room_allocated = FALSE, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [incidentId]);
        }

        await client.query('COMMIT');

        res.status(200).json({
            success: true,
            message: 'Room allocation deleted permanently'
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting room allocation:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};