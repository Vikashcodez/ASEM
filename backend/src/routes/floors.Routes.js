import express from 'express';
import {
  createFloor,
  getAllFloors,
  getFloorById,
  getFloorsByTerminal,
  getFloorsByBlock,
  updateFloor,
  deleteFloor,
  deactivateFloor,
  activateFloor,
  bulkCreateFloors,
  getFloorStats,
  getFloorsByLevelRange,
  getFloorHierarchy
} from '../controllers/floors.controller.js';

const floorsRouter = express.Router();

// Basic CRUD routes
floorsRouter.post('/', createFloor);                    // Create floor
floorsRouter.get('/', getAllFloors);                    // Get all floors
floorsRouter.get('/:id', getFloorById);                // Get floor by ID
floorsRouter.put('/:id', updateFloor);                 // Update floor
floorsRouter.delete('/:id', deleteFloor);              // Delete floor

// Additional get routes
floorsRouter.get('/terminal/:terminal_id', getFloorsByTerminal);  // Get floors by terminal
floorsRouter.get('/block/:block_id', getFloorsByBlock);           // Get floors by block
floorsRouter.get('/floors/range/:min/:max', getFloorsByLevelRange);      // Get floors by level range
floorsRouter.get('/hierarchy/floors', getFloorHierarchy);                // Get complete hierarchy

// Status management
floorsRouter.patch('/:id/deactivate', deactivateFloor);
floorsRouter.patch('/:id/activate', activateFloor);

// Bulk operations and statistics
floorsRouter.post('/bulk', bulkCreateFloors);
floorsRouter.get('/stats', getFloorStats);

export default floorsRouter;