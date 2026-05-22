import express from 'express';
import {
    getRoles,
    createRolesTable,
} from '../controllers/roles.Controller.js';

const RolesRouter = express.Router();

RolesRouter.post('/', createRolesTable);
RolesRouter.get('/', getRoles);

export default RolesRouter;