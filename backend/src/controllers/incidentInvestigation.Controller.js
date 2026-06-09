// incidentInvestigations.controller.js
import { pool} from '../config/database.js'; 

// Display all investigations
export const getAllInvestigations = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT ii.*, 
                   CONCAT(e.first_name, ' ', e.last_name) as investigator_name,
                   i.incident_title as incident_title
            FROM Incident_Investigations ii
            LEFT JOIN employees e ON ii.investigator_id = e.id
            LEFT JOIN Incidents i ON ii.incident_id = i.id
            ORDER BY ii.created_at DESC
        `);
        
        res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching investigations:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching investigations',
            error: error.message
        });
    }
};

// Get single investigation by ID
export const getInvestigationById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(`
            SELECT ii.*, 
                   CONCAT(e.first_name, ' ', e.last_name) as investigator_name,
                   i.incident_title as incident_title
            FROM Incident_Investigations ii
            LEFT JOIN employees e ON ii.investigator_id = e.id
            LEFT JOIN Incidents i ON ii.incident_id = i.id
            WHERE ii.id = $1
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Investigation not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching investigation:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching investigation',
            error: error.message
        });
    }
};

// Get investigations by incident ID
export const getInvestigationsByIncident = async (req, res) => {
    try {
        const { incidentId } = req.params;
        
        const result = await pool.query(`
            SELECT ii.*, 
                   CONCAT(e.first_name, ' ', e.last_name) as investigator_name
            FROM Incident_Investigations ii
            LEFT JOIN employees e ON ii.investigator_id = e.id
            WHERE ii.incident_id = $1
            ORDER BY ii.created_at DESC
        `, [incidentId]);
        
        res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching investigations by incident:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching investigations',
            error: error.message
        });
    }
};

// Create new investigation
export const createInvestigation = async (req, res) => {
    const client = await pool.connect();
    
    try {
        const {
            incident_id,
            investigation_description,
            reason_for_incident,
            total_damage_estimate,
            evidence_files,
            notes,
            investigator_id
        } = req.body;
        
        // Validation
        if (!incident_id) {
            return res.status(400).json({
                success: false,
                message: 'Incident ID is required'
            });
        }
        
        // Start transaction
        await client.query('BEGIN');
        
        // Insert investigation
        const investigationResult = await client.query(`
            INSERT INTO Incident_Investigations (
                incident_id,
                investigation_description,
                reason_for_incident,
                total_damage_estimate,
                evidence_files,
                notes,
                investigator_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [
            incident_id,
            investigation_description,
            reason_for_incident,
            total_damage_estimate,
            evidence_files,
            notes,
            investigator_id || null
        ]);
        
        // Update incident status to CLOSED
        await client.query(`
            UPDATE Incidents 
            SET incident_status = 'CLOSED',
             is_active = FALSE,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND incident_status != 'CLOSED'
        `, [incident_id]);
        
        // Get active room allocations for this incident
        const allocationsResult = await client.query(`
            SELECT id, room_id 
            FROM Incident_Room_Allocations 
            WHERE incident_id = $1 AND deallocated_at IS NULL
        `, [incident_id]);
        
        // Deallocate all rooms for this incident
        for (const allocation of allocationsResult.rows) {
            // Update allocation with deallocation time
            await client.query(`
                UPDATE Incident_Room_Allocations 
                SET deallocated_at = CURRENT_TIMESTAMP,
                    note = COALESCE(note, '') || '\nAutomatically deallocated upon incident closure'
                WHERE id = $1
            `, [allocation.id]);
            
            // Update room status to AVAILABLE and reset occupancy
            await client.query(`
                UPDATE Rooms 
                SET room_status = 'AVAILABLE',
                    current_occupancy = 0,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [allocation.room_id]);
        }
        
        // Commit transaction
        await client.query('COMMIT');
        
        res.status(201).json({
            success: true,
            message: 'Investigation created successfully. Incident closed and rooms deallocated.',
            data: {
                investigation: investigationResult.rows[0],
                deallocated_rooms: allocationsResult.rowCount,
                incident_status: 'CLOSED'
            }
        });
    } catch (error) {
        // Rollback transaction on error
        await client.query('ROLLBACK');
        console.error('Error creating investigation:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating investigation',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Update investigation
export const updateInvestigation = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            incident_id,
            investigation_description,
            reason_for_incident,
            total_damage_estimate,
            evidence_files,
            notes,
            investigator_id
        } = req.body;
        
        // Check if investigation exists
        const checkResult = await pool.query(
            'SELECT * FROM Incident_Investigations WHERE id = $1',
            [id]
        );
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Investigation not found'
            });
        }
        
        const result = await pool.query(`
            UPDATE Incident_Investigations 
            SET 
                incident_id = COALESCE($1, incident_id),
                investigation_description = COALESCE($2, investigation_description),
                reason_for_incident = COALESCE($3, reason_for_incident),
                total_damage_estimate = COALESCE($4, total_damage_estimate),
                evidence_files = COALESCE($5, evidence_files),
                notes = COALESCE($6, notes),
                investigator_id = COALESCE($7, investigator_id)
            WHERE id = $8
            RETURNING *
        `, [
            incident_id,
            investigation_description,
            reason_for_incident,
            total_damage_estimate,
            evidence_files,
            notes,
            investigator_id,
            id
        ]);
        
        res.status(200).json({
            success: true,
            message: 'Investigation updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating investigation:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating investigation',
            error: error.message
        });
    }
};

// Delete investigation
export const deleteInvestigation = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if investigation exists
        const checkResult = await pool.query(
            'SELECT * FROM Incident_Investigations WHERE id = $1',
            [id]
        );
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Investigation not found'
            });
        }
        
        await pool.query('DELETE FROM Incident_Investigations WHERE id = $1', [id]);
        
        res.status(200).json({
            success: true,
            message: 'Investigation deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting investigation:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting investigation',
            error: error.message
        });
    }
};

// Add evidence files to investigation
export const addEvidenceFiles = async (req, res) => {
    try {
        const { id } = req.params;
        const { evidence_files } = req.body;
        
        if (!evidence_files) {
            return res.status(400).json({
                success: false,
                message: 'Evidence files are required'
            });
        }
        
        const result = await pool.query(`
            UPDATE Incident_Investigations 
            SET evidence_files = $1
            WHERE id = $2
            RETURNING *
        `, [evidence_files, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Investigation not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Evidence files added successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error adding evidence files:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding evidence files',
            error: error.message
        });
    }
};

// Add notes to investigation
export const addNotes = async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        
        if (!notes) {
            return res.status(400).json({
                success: false,
                message: 'Notes are required'
            });
        }
        
        const result = await pool.query(`
            UPDATE Incident_Investigations 
            SET notes = CONCAT(COALESCE(notes, ''), '\n', $1, '\n---\nAdded: ', CURRENT_TIMESTAMP)
            WHERE id = $2
            RETURNING *
        `, [notes, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Investigation not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Notes added successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error adding notes:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding notes',
            error: error.message
        });
    }
};