import express from 'express'
import * as marketController from './market.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
const router = express.Router();

router.post("/", authMiddleware, marketController.createMarket)
router.get("/:marketId", authMiddleware, marketController.getMarket)
router.post("/:marketId/open", authMiddleware, marketController.openMarket)
router.post("/:marketId/close", authMiddleware, marketController.closeMarket)

export default router;
