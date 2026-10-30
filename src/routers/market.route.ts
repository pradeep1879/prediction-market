import express from 'express'
import { createMarket, placeBet, getBets, getMarkets, resolve } from '../controller/market.controller';
import { authMiddleware } from '../middleware/auth.middleware';
const marketRouter = express.Router();


marketRouter.get("/", authMiddleware,  getMarkets);
marketRouter.post("/create", authMiddleware,  createMarket);
marketRouter.post("/:marketId/bet", authMiddleware,  placeBet);
marketRouter.get("/bets", authMiddleware,  getBets);
marketRouter.get("/:marketId/resolve", authMiddleware,  resolve);

export default marketRouter;