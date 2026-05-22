import express from 'express';
import {
  registerEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  deactivateEmployee,
  activateEmployee,
  resetPassword,
  changePassword,
  getEmployeesByRole,
  getEmployeeStats
} from '../controllers/employee.controller.js';

const employeeRouter = express.Router();

// Basic CRUD routes
employeeRouter.post('/register', registerEmployee);     
employeeRouter.get('/', getAllEmployees);                
employeeRouter.get('/:id', getEmployeeById);            
employeeRouter.put('/:id', updateEmployee);             
employeeRouter.delete('/:id', deleteEmployee);          

// Status management
employeeRouter.patch('/:id/deactivate', deactivateEmployee);
employeeRouter.patch('/:id/activate', activateEmployee);

// Password management
employeeRouter.post('/:id/reset-password', resetPassword);  
employeeRouter.post('/:id/change-password', changePassword); 

// Additional routes
employeeRouter.get('/role/:role_id', getEmployeesByRole);    
employeeRouter.get('/stats', getEmployeeStats);              

export default employeeRouter;