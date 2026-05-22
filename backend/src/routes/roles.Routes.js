import express from 'express';
import {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
  deactivateRole,
  activateRole
} from '../controllers/roles.Controller.js';

const RolesRouter = express.Router();

// CRUD Routes
RolesRouter.post('/', createRole);           
RolesRouter.get('/', getAllRoles);           
RolesRouter.get('/:id', getRoleById);       
RolesRouter.put('/:id', updateRole);        
RolesRouter.delete('/:id', deleteRole);     

// Additional routes
RolesRouter.patch('/:id/deactivate', deactivateRole);  
RolesRouter.patch('/:id/activate', activateRole);     

export default RolesRouter;