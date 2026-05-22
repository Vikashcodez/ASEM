import express from 'express';
import {
  createRoom,
  getAllRooms,
  getRoomById,
  getRoomsByFloor,
  getAvailableRooms,
  updateRoom,
  updateRoomOccupancy,
  deleteRoom,
  deactivateRoom,
  activateRoom,
  bulkCreateRooms,
  getRoomStats,
  getRoomTypes,
  getRoomStatusSummary
} from '../controllers/rooms.controller.js';

const roomsRouter = express.Router();

// Specific routes first so they are not captured by :id
roomsRouter.get('/floor/:floor_id', getRoomsByFloor);        // Get rooms by floor
roomsRouter.get('/available/all', getAvailableRooms);        // Get available rooms
roomsRouter.get('/types/all', getRoomTypes);                 // Get all room types
roomsRouter.get('/status/summary', getRoomStatusSummary);    // Get status summary
roomsRouter.post('/bulk', bulkCreateRooms);
roomsRouter.get('/stats', getRoomStats);

// Basic CRUD routes
roomsRouter.post('/', createRoom);                    // Create room
roomsRouter.get('/', getAllRooms);                    // Get all rooms
roomsRouter.get('/:id', getRoomById);                // Get room by ID
roomsRouter.put('/:id', updateRoom);                 // Update room
roomsRouter.delete('/:id', deleteRoom);              // Delete room

// Specialized operations
roomsRouter.patch('/:id/occupancy', updateRoomOccupancy);    // Update occupancy

// Status management
roomsRouter.patch('/:id/deactivate', deactivateRoom);
roomsRouter.patch('/:id/activate', activateRoom);

export default roomsRouter;