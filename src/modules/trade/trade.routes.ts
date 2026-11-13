import express from 'express';
import * as tradeController from '../trade/trade.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
const router = express.Router();


router.get("/", authMiddleware, tradeController.getUserTrades);
router.get("/markets/:marketId",  tradeController.getMarketTrades);

export default router;