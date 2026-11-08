import express from 'express'
import * as orderController from '../order/order.controller'
import { authMiddleware } from '../../middleware/auth.middleware';
const router = express.Router();


router.post("/:marketId", authMiddleware, orderController.placeOrder);
router.get("/:marketId", authMiddleware, orderController.getUserOrders);
router.get("/:orderId", authMiddleware, orderController.getOrderById);

export default router