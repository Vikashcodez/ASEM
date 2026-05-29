import express from 'express';
import {
    getAllInvestigations,
    getInvestigationById,
    getInvestigationsByIncident,
    createInvestigation,
    updateInvestigation,
    deleteInvestigation,
    addEvidenceFiles,
    addNotes
} from '../controllers/incidentInvestigation.Controller.js';

const incidentInvestigationRouter = express.Router();

// GET routes
incidentInvestigationRouter.get('/', getAllInvestigations);
incidentInvestigationRouter.get('/:id', getInvestigationById);
incidentInvestigationRouter.get('/incident/:incidentId', getInvestigationsByIncident);

// POST routes
incidentInvestigationRouter.post('/', createInvestigation);
incidentInvestigationRouter.post('/:id/evidence', addEvidenceFiles);
incidentInvestigationRouter.post('/:id/notes', addNotes);

// PUT routes
incidentInvestigationRouter.put('/:id', updateInvestigation);

// DELETE routes
incidentInvestigationRouter.delete('/:id', deleteInvestigation);

export default incidentInvestigationRouter;