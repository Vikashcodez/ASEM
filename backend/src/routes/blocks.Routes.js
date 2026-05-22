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

// Basic CRUD routes
blocksRouter.post('/', createBlock);                    // Create block
blocksRouter.get('/', getAllBlocks);                    // Get all blocks
blocksRouter.get('/:id', getBlockById);                // Get block by ID
blocksRouter.put('/:id', updateBlock);                 // Update block
blocksRouter.delete('/:id', deleteBlock);              // Delete block

// Additional get routes
blocksRouter.get('/terminal/:terminal_id', getBlocksByTerminal);  // Get blocks by terminal
blocksRouter.get('/types/all', getBlockTypes);                    // Get all block types
blocksRouter.get('/search/advanced', searchBlocks);               // Advanced search

// Status management
blocksRouter.patch('/:id/deactivate', deactivateBlock);
blocksRouter.patch('/:id/activate', activateBlock);

// Bulk operations and statistics
blocksRouter.post('/bulk', bulkCreateBlocks);
blocksRouter.get('/stats', getBlockStats);

export default blocksRouter;