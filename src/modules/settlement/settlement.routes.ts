import express from 'express'
import { authMiddleware } from '../../middleware/auth.middleware';
import * as settlementController from '../settlement/settlement.controller'
const router = express.Router();

router.post("/market/:marketId", authMiddleware, settlementController.settleMarket)
router.get("/market/:marketId", authMiddleware, settlementController.getMarketSettlement)

export default router;