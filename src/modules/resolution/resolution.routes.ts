import express from 'express'
import * as resolutionController from '../resolution/resolution.controller'
import { authMiddleware } from '../../middleware/auth.middleware';
const router = express.Router();


router.post("/markets/:marketId", authMiddleware, resolutionController.createMarketResolution);
router.post("/:resolutionId/confirm", authMiddleware, resolutionController.confirmMarketResolution);

export default router;