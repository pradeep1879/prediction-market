import type { NextFunction, Request, Response } from 'express';
import * as tradeService from '../trade/trade.service';
import { AppError } from '../../utils/AppError';
import { getMarketTradesSchema, getUserTradesSchema } from './trade.schema';



export const getUserTrades = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const { marketId } = req.params;
    if(!userId){
      throw new AppError(400, "userId is not valid");
    }
    if(!marketId || typeof marketId !== "string"){
      throw new AppError(400, "Invalid marketId");
    }

    const result = getUserTradesSchema.safeParse(req.query);
    if(!result.success){
      throw new AppError(400, result.error.issues[0]?.message!)
    }

    const trades = await tradeService.getUserTrades(userId, marketId, result.data);

    return res.status(200).json({
      success: true,
      message: "User Trades fetched successfully",
      data: trades
    })
  } catch (error) {
    next(error)
  }
}


export const getMarketTrades = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { marketId } = req.params;
    if(!marketId || typeof marketId !== "string"){
      throw new AppError(400, "Invalid marketId");
    }

    const result = getMarketTradesSchema.safeParse(req.query);
    if(!result.success){
      throw new AppError(400, result.error.issues[0]?.message!)
    }

    const trades = await tradeService.getMarketTrades(marketId, result.data);

    return res.status(200).json({
      success: true,
      message: "Market Trades fetched successfully",
      data: trades
    })
  } catch (error) {
    next(error)
  }
}