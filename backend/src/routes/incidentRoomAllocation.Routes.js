import express from 'express';
import {
    getAllRoomAllocations,
    getRoomAllocationById,
    getAllocationsByIncidentId,
    getActiveAllocations,
    createRoomAllocation,
    updateRoomAllocation,
    deallocateRoom,
    deleteRoomAllocation
} from '../controllers/incidentRoomAllocation.Controller.js';

const incidentRoomAllocationRouter = express.Router();

// Display routes
incidentRoomAllocationRouter.get('/', getAllRoomAllocations);
incidentRoomAllocationRouter.get('/active', getActiveAllocations);
incidentRoomAllocationRouter.get('/:id', getRoomAllocationById);
incidentRoomAllocationRouter.get('/:incidentId/room-allocations', getAllocationsByIncidentId);

// Create route
incidentRoomAllocationRouter.post('/', createRoomAllocation);

// Edit routes
incidentRoomAllocationRouter.put('/:id', updateRoomAllocation);
incidentRoomAllocationRouter.patch('/:id/deallocate', deallocateRoom);

// Delete route
incidentRoomAllocationRouter.delete('/:id', deleteRoomAllocation);

export default incidentRoomAllocationRouter;