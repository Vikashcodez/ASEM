import express from 'express';
import {
    createIncident,
    getAllIncidents,
    getIncidentById,
    updateIncident,
    deleteIncident,
    permanentDeleteIncident,
    getIncidentStatistics,
    getIncidentsByRoom,
    updateIncidentStatus,
    getActiveIncidentsWithoutRoomAllocation
    // releaseIncident,
    // getIncidentReports
} from '../controllers/incidents.Controller.js';

const incidentsRouter = express.Router();

// Incident CRUD routes
incidentsRouter.post('/', createIncident);
incidentsRouter.get('/', getAllIncidents);
incidentsRouter.get('/active', getActiveIncidentsWithoutRoomAllocation);
// incidentsRouter.get('/reports', getIncidentReports);
incidentsRouter.get('/status/summary', getIncidentStatistics);
incidentsRouter.get('/statistics', getIncidentStatistics);
incidentsRouter.get('/:id', getIncidentById);
incidentsRouter.put('/:id', updateIncident);
//incidentsRouter.put('/:id/release', releaseIncident);
incidentsRouter.patch('/:id/status', updateIncidentStatus);
incidentsRouter.delete('/:id', deleteIncident);
incidentsRouter.delete('/:id/permanent', permanentDeleteIncident);

// Room specific incidents
incidentsRouter.get('/rooms/:room_id', getIncidentsByRoom);


export default incidentsRouter;