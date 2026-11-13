import type { NextFunction, Request, Response } from 'express';
import * as tradeService from '../trade/trade.service';
import { AppError } from '../../utils/AppError';
import { getUserOrdersSchema } from '../order/order.schema';



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

    const result = getUserOrdersSchema.safeParse(req.query);
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