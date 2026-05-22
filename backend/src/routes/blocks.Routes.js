import express from 'express';
import {
  createBlock,
  getAllBlocks,
  getBlockById,
  getBlocksByTerminal,
  updateBlock,
  deleteBlock,
  deactivateBlock,
  activateBlock,
  bulkCreateBlocks,
  getBlockStats,
  getBlockTypes,
  searchBlocks
} from '../controllers/blocks.controller.js';

const blocksRouter = express.Router();

// Specific routes first so they are not captured by :id
blocksRouter.get('/terminal/:terminal_id', getBlocksByTerminal);  // Get blocks by terminal
blocksRouter.get('/types/all', getBlockTypes);                    // Get all block types
blocksRouter.get('/search/advanced', searchBlocks);               // Advanced search
blocksRouter.post('/bulk', bulkCreateBlocks);
blocksRouter.get('/stats', getBlockStats);

// Basic CRUD routes
blocksRouter.post('/', createBlock);                    // Create block
blocksRouter.get('/', getAllBlocks);                    // Get all blocks
blocksRouter.get('/:id', getBlockById);                // Get block by ID
blocksRouter.put('/:id', updateBlock);                 // Update block
blocksRouter.delete('/:id', deleteBlock);              // Delete block

// Status management
blocksRouter.patch('/:id/deactivate', deactivateBlock);
blocksRouter.patch('/:id/activate', activateBlock);

export default blocksRouter;