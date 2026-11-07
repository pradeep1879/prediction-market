import express from 'express'
import * as orderController from '../order/order.controller'
import { authMiddleware } from '../../middleware/auth.middleware';
const router = express.Router();


router.post("/", authMiddleware, orderController.placeOrder);

export default router