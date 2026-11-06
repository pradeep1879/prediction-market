import express from 'express'
import * as positionController from './positions.controller'
import { authMiddleware } from '../../middleware/auth.middleware';
const router = express.Router();

router.get("/", authMiddleware, positionController.getUserPositions);

export default router;

