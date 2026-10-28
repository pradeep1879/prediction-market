import express from 'express'
import { createMarket } from '../controller/market.controller';
import { authMiddleware } from '../middleware/auth.middleware';
const marketRouter = express.Router();


marketRouter.post("/create", authMiddleware,  createMarket);

export default marketRouter;