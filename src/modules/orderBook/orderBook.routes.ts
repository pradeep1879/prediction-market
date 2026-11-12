import express from 'express';
import * as orderBookController from '../orderBook/orderBook.controller'
import { authMiddleware } from '../../middleware/auth.middleware';
const router = express.Router();

router.get("/markets/:marketId/orderBook", authMiddleware, orderBookController.getMarketOrderbook);

export default router;