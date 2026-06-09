import { pool } from '../config/database.js';

// Helper function to generate incident code
const generateIncidentCode = async () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const prefix = `INC-${year}${month}${day}`;
    
    const result = await pool.query(
        `SELECT COUNT(*) FROM incidents WHERE incident_code LIKE $1`,
        [`${prefix}%`]
    );
    
    const count = parseInt(result.rows[0].count) + 1;
    return `${prefix}-${String(count).padStart(4, '0')}`;
};

// ==================== CREATE INCIDENT ====================
export const createIncident = async (req, res) => {
    try {
        const {
            incident_type,
            incident_title,
            location_details,
            description,
            severity_level,
            incident_status,
            reported_by
        } = req.body;

        // Validate required fields
        if (!incident_type) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: incident_type is required'
            });
        }

        // Check if employee exists (if reported_by is provided)
        if (reported_by) {
            const employeeCheck = await pool.query(
                'SELECT id FROM employees WHERE id = $1 AND is_active = true',
                [reported_by]
            );
            
            if (employeeCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Employee not found or inactive'
                });
            }
        }

        // Generate incident code
        const incident_code = await generateIncidentCode();

        // Insert incident
        const result = await pool.query(
            `INSERT INTO incidents (
                incident_code, incident_type, incident_title, 
                location_details, description, severity_level, 
                incident_status, reported_by, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
            RETURNING *`,
            [
                incident_code,
                incident_type,
                incident_title,
                location_details,
                description,
                severity_level,
                incident_status || 'OPEN',
                reported_by || null
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Incident created successfully',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error creating incident:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating incident',
            error: error.message
        });
    }
};

// ==================== GET ALL INCIDENTS ====================
export const getAllIncidents = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            incident_status,
            severity_level,
            incident_type,
            from_date,
            to_date,
            search
        } = req.query;

        const offset = (page - 1) * limit;
        let queryParams = [];
        let whereConditions = ['i.is_active = true'];
        let paramIndex = 1;

        // Apply filters
        if (incident_status) {
            whereConditions.push(`i.incident_status = $${paramIndex++}`);
            queryParams.push(incident_status);
        }

        if (severity_level) {
            whereConditions.push(`i.severity_level = $${paramIndex++}`);
            queryParams.push(severity_level);
        }

        if (incident_type) {
            whereConditions.push(`i.incident_type = $${paramIndex++}`);
            queryParams.push(incident_type);
        }

        if (from_date) {
            whereConditions.push(`DATE(i.created_at) >= $${paramIndex++}`);
            queryParams.push(from_date);
        }

        if (to_date) {
            whereConditions.push(`DATE(i.created_at) <= $${paramIndex++}`);
            queryParams.push(to_date);
        }

        if (search) {
            whereConditions.push(`(
                i.incident_code ILIKE $${paramIndex++} OR
                i.incident_title ILIKE $${paramIndex++} OR
                i.description ILIKE $${paramIndex++} OR
                i.incident_type ILIKE $${paramIndex++}
            )`);
            const searchPattern = `%${search}%`;
            queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        const whereClause = whereConditions.length > 0 
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';

        // Get total count
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM incidents i ${whereClause}`,
            queryParams
        );
        const total = parseInt(countResult.rows[0].count);

        // Get paginated incidents with relations
        queryParams.push(limit, offset);
        const result = await pool.query(
            `SELECT 
                i.*,
                CASE 
                    WHEN i.reported_by IS NOT NULL THEN 
                        jsonb_build_object(
                            'employee_id', e.id,
                            'employee_name', CONCAT(e.first_name, ' ', e.last_name),
                            'email', e.email,
                            'phone', e.contact_number
                        )
                    ELSE NULL
                END as reported_by_details
            FROM incidents i
            LEFT JOIN employees e ON i.reported_by = e.id
            ${whereClause}
            ORDER BY i.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
            queryParams
        );

        res.status(200).json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching incidents:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching incidents',
            error: error.message
        });
    }
};

// ==================== GET INCIDENT BY ID ====================
export const getIncidentById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^\d+$/.test(String(id))) {
            return res.status(400).json({
                success: false,
                message: 'Incident id must be a numeric value'
            });
        }

        const incident = await getIncidentWithRelations(id);

        if (!incident) {
            return res.status(404).json({
                success: false,
                message: 'Incident not found'
            });
        }

        res.status(200).json({
            success: true,
            data: incident
        });

    } catch (error) {
        console.error('Error fetching incident:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching incident',
            error: error.message
        });
    }
};

// Helper function to get incident with relations
async function getIncidentWithRelations(incidentId) {
    const result = await pool.query(
        `SELECT 
            i.*,
            CASE 
                WHEN i.reported_by IS NOT NULL THEN 
                    jsonb_build_object(
                        'employee_id', e.id,
                        'employee_name', CONCAT(e.first_name, ' ', e.last_name),
                        'email', e.email,
                        'phone', e.contact_number
                    )
                ELSE NULL
            END as reported_by_details
        FROM incidents i
        LEFT JOIN employees e ON i.reported_by = e.id
        WHERE i.id = $1 AND i.is_active = true`,
        [incidentId]
    );

    return result.rows[0] || null;
}

// ==================== UPDATE INCIDENT ====================
export const updateIncident = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            incident_type,
            incident_title,
            location_details,
            description,
            severity_level,
            incident_status,
            reported_by
        } = req.body;

        // Check if incident exists
        const existingIncident = await pool.query(
            'SELECT * FROM incidents WHERE id = $1 AND is_active = true',
            [id]
        );

        if (existingIncident.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Incident not found'
            });
        }

        const oldIncident = existingIncident.rows[0];

        // Check if employee exists
        if (reported_by) {
            const employeeCheck = await pool.query(
                'SELECT id FROM employees WHERE id = $1 AND is_active = true',
                [reported_by]
            );
            
            if (employeeCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Employee not found or inactive'
                });
            }
        }

        // Build update query dynamically
        const updateFields = [];
        const queryParams = [];
        let paramIndex = 1;
        if (incident_type !== undefined) {
            updateFields.push(`incident_type = $${paramIndex++}`);
            queryParams.push(incident_type);
        }
        if (incident_title !== undefined) {
            updateFields.push(`incident_title = $${paramIndex++}`);
            queryParams.push(incident_title);
        }
        if (location_details !== undefined) {
            updateFields.push(`location_details = $${paramIndex++}`);
            queryParams.push(location_details);
        }
        if (description !== undefined) {
            updateFields.push(`description = $${paramIndex++}`);
            queryParams.push(description);
        }
        if (severity_level !== undefined) {
            updateFields.push(`severity_level = $${paramIndex++}`);
            queryParams.push(severity_level);
        }
        if (incident_status !== undefined) {
            updateFields.push(`incident_status = $${paramIndex++}`);
            queryParams.push(incident_status);
        }
        if (reported_by !== undefined) {
            updateFields.push(`reported_by = $${paramIndex++}`);
            queryParams.push(reported_by);
        }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        queryParams.push(id);

        const result = await pool.query(
            `UPDATE incidents 
             SET ${updateFields.join(', ')}
             WHERE id = $${paramIndex} AND is_active = true
             RETURNING *`,
            queryParams
        );

        const updatedIncident = await getIncidentWithRelations(result.rows[0].id);

        res.status(200).json({
            success: true,
            message: 'Incident updated successfully',
            data: updatedIncident
        });

    } catch (error) {
        console.error('Error updating incident:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating incident',
            error: error.message
        });
    }
};

// ==================== DELETE INCIDENT (Soft Delete) ====================
export const deleteIncident = async (req, res) => {
    try {
        const { id } = req.params;

        // Get incident details before deletion
        const incident = await pool.query(
            'SELECT * FROM incidents WHERE id = $1 AND is_active = true',
            [id]
        );

        if (incident.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Incident not found'
            });
        }

        const incidentData = incident.rows[0];

        // Soft delete the incident
        await pool.query(
            `UPDATE incidents 
             SET is_active = false, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [id]
        );

        res.status(200).json({
            success: true,
            message: 'Incident deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting incident:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting incident',
            error: error.message
        });
    }
};

// ==================== PERMANENT DELETE INCIDENT ====================
export const permanentDeleteIncident = async (req, res) => {
    try {
        const { id } = req.params;

        // Get incident details before permanent deletion
        const incident = await pool.query(
            'SELECT * FROM incidents WHERE id = $1',
            [id]
        );

        if (incident.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Incident not found'
            });
        }

        const incidentData = incident.rows[0];

        // Permanently delete the incident
        await pool.query('DELETE FROM incidents WHERE id = $1', [id]);

        res.status(200).json({
            success: true,
            message: 'Incident permanently deleted successfully'
        });

    } catch (error) {
        console.error('Error permanently deleting incident:', error);
        res.status(500).json({
            success: false,
            message: 'Error permanently deleting incident',
            error: error.message
        });
    }
};

// ==================== GET INCIDENT STATISTICS ====================
export const getIncidentStatistics = async (req, res) => {
    try {
        const { from_date, to_date } = req.query;
        
        let dateFilter = '';
        let queryParams = [];
        let paramIndex = 1;

        if (from_date && to_date) {
            dateFilter = `AND DATE(created_at) BETWEEN $${paramIndex++} AND $${paramIndex++}`;
            queryParams.push(from_date, to_date);
        }

        const result = await pool.query(
            `SELECT 
                COUNT(*) as total_incidents,
                COUNT(*) FILTER (WHERE incident_status = 'OPEN') as open_incidents,
                COUNT(*) FILTER (WHERE incident_status = 'IN_PROGRESS') as in_progress_incidents,
                COUNT(*) FILTER (WHERE incident_status = 'RESOLVED') as resolved_incidents,
                COUNT(*) FILTER (WHERE incident_status = 'CLOSED') as closed_incidents,
                COUNT(*) FILTER (WHERE severity_level = 'LOW') as low_severity,
                COUNT(*) FILTER (WHERE severity_level = 'MEDIUM') as medium_severity,
                COUNT(*) FILTER (WHERE severity_level = 'HIGH') as high_severity,
                COUNT(*) FILTER (WHERE severity_level = 'CRITICAL') as critical_severity,
                0 as total_people_affected,
                AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as avg_resolution_hours
            FROM incidents 
            WHERE is_active = true ${dateFilter}`,
            queryParams
        );

        // Get incidents by type
        const typeResult = await pool.query(
            `SELECT 
                incident_type,
                COUNT(*) as count
            FROM incidents 
            WHERE is_active = true ${dateFilter}
            GROUP BY incident_type
            ORDER BY count DESC
            LIMIT 5`,
            queryParams
        );

        // Get incidents by day (last 7 days)
        const dailyResult = await pool.query(
            `SELECT 
                DATE(created_at) as date,
                COUNT(*) as count
            FROM incidents 
            WHERE is_active = true 
                AND created_at >= NOW() - INTERVAL '7 days'
            GROUP BY DATE(created_at)
            ORDER BY date DESC`,
            queryParams
        );

        res.status(200).json({
            success: true,
            data: {
                overview: result.rows[0],
                by_type: typeResult.rows,
                daily_trend: dailyResult.rows
            }
        });

    } catch (error) {
        console.error('Error fetching incident statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching incident statistics',
            error: error.message
        });
    }
};

// ==================== GET INCIDENTS BY ROOM ====================
export const getIncidentsByRoom = async (req, res) => {
    try {
        const { room_id } = req.params;

        const result = await pool.query(
            `SELECT 
                i.*,
                ira.id as allocation_id,
                ira.room_id,
                ira.no_of_people,
                ira.note,
                ira.allocated_at,
                ira.deallocated_at,
                jsonb_build_object(
                    'employee_id', e.id,
                    'employee_name', CONCAT(e.first_name, ' ', e.last_name),
                    'email', e.email,
                    'phone', e.contact_number
                ) as reported_by_details
             FROM incident_room_allocations ira
             INNER JOIN incidents i ON ira.incident_id = i.id
             LEFT JOIN employees e ON i.reported_by = e.id
             WHERE ira.room_id = $1
               AND i.is_active = true
               AND i.is_room_allocated = true
               AND ira.deallocated_at IS NULL
             ORDER BY ira.allocated_at DESC`,
            [room_id]
        );

        res.status(200).json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error fetching incidents by room:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching incidents by room',
            error: error.message
        });
    }
};

// ==================== UPDATE INCIDENT STATUS ====================
export const updateIncidentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { incident_status, resolution_notes } = req.body;

        if (!incident_status) {
            return res.status(400).json({
                success: false,
                message: 'Incident status is required'
            });
        }

        const result = await pool.query(
            `UPDATE incidents 
             SET incident_status = $1, 
                 description = CASE 
                     WHEN $2 IS NOT NULL THEN description || '\n\nResolution Notes: ' || $2
                     ELSE description
                 END,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3 AND is_active = true
             RETURNING *`,
            [incident_status, resolution_notes, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Incident not found'
            });
        }

        const updatedIncident = await getIncidentWithRelations(id);

        res.status(200).json({
            success: true,
            message: 'Incident status updated successfully',
            data: updatedIncident
        });

    } catch (error) {
        console.error('Error updating incident status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating incident status',
            error: error.message
        });
    }
};

// ==================== GET ACTIVE INCIDENT ====================
export const getActiveIncidentsWithoutRoomAllocation = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                id,
                incident_code,
                incident_type,
                incident_title,
                location_details,
                description,
                severity_level,
                incident_status,
                reported_by,
                is_active,
                is_room_allocated,
                created_at,
                updated_at,
                (
                    SELECT CONCAT(first_name, ' ', last_name)
                    FROM employees
                    WHERE id = incidents.reported_by
                ) as reported_by_name
            FROM Incidents
            WHERE is_active = true 
            AND is_room_allocated = false
            ORDER BY created_at DESC
        `);

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching active incidents without room allocation:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// ==================== GET ACTIVE INCIDENTS with Room Allocation ====================
export const getActiveIncidentsWithRoomAllocation = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                i.*,
                (
                    SELECT CONCAT(first_name, ' ', last_name)
                    FROM employees
                    WHERE id = i.reported_by
                ) as reported_by_name,
                (
                    SELECT COALESCE(jsonb_agg(jsonb_build_object(
                        'allocation_id', ira.id,
                        'room_id', ira.room_id,
                        'no_of_people', ira.no_of_people,
                        'note', ira.note,
                        'allocated_at', ira.allocated_at,
                        'deallocated_at', ira.deallocated_at,
                        'allocated_by', CASE WHEN ae.id IS NOT NULL THEN jsonb_build_object('employee_id', ae.id, 'employee_name', CONCAT(ae.first_name, ' ', ae.last_name)) ELSE NULL END
                    )), '[]'::jsonb)
                    FROM incident_room_allocations ira
                    LEFT JOIN employees ae ON ira.allocated_by = ae.id
                    WHERE ira.incident_id = i.id
                ) as room_allocations
            FROM incidents i
            WHERE i.is_active = true 
            AND i.is_room_allocated = true
            ORDER BY i.created_at DESC
        `);

        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching active incidents with room allocation:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

