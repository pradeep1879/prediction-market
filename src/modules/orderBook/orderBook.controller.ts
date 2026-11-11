import type { NextFunction, Request, Response } from 'express'
import * as orderBookService from '../orderBook/orderBook.service'
import { AppError } from '../../utils/AppError';


export const getOrderBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { marketId } = req.params;
      if(!marketId || typeof marketId !== "string"){
        throw new AppError(400, "MarketId is not valid")
      }
    const result = await orderBookService.getOrderBook(marketId);
    return res.status(200).json({
      success: true,
      message: "OrderBook fetched successfully",
      data: result
    })
  } catch (error) {
    next(error);
  }
}