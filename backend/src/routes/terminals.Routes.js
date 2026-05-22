import express from 'express';
import {
  createTerminal,
  getAllTerminals,
  getTerminalById,
  getTerminalByCode,
  updateTerminal,
  deleteTerminal,
  deactivateTerminal,
  activateTerminal,
  bulkCreateTerminals,
  getTerminalStats,
  searchTerminals
} from '../controllers/terminals.controller.js';

const terminalsRouter = express.Router();

// Basic CRUD routes
terminalsRouter.post('/', createTerminal);           // Create terminal
terminalsRouter.get('/', getAllTerminals);           // Get all terminals
terminalsRouter.get('/:id', getTerminalById);       // Get terminal by ID
terminalsRouter.put('/:id', updateTerminal);        // Update terminal
terminalsRouter.delete('/:id', deleteTerminal);     // Delete terminal

// Additional get routes (place before generic routes)
terminalsRouter.get('/code/:code', getTerminalByCode);  // Get by code
terminalsRouter.get('/search/all', searchTerminals);    // Advanced search

// Status management
terminalsRouter.patch('/:id/deactivate', deactivateTerminal);
terminalsRouter.patch('/:id/activate', activateTerminal);

// Bulk operations and statistics
terminalsRouter.post('/bulk', bulkCreateTerminals);
terminalsRouter.get('/stats/terminals', getTerminalStats);

export default terminalsRouter;