import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import * as settlementService from '../settlement/settlement.service';
import { marketSettlementSchema } from "./settlement.schema";

export const settleMarket = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const { marketId } = req.params;
    if(!marketId || typeof marketId !== "string"){
      throw new AppError(400, "MarketId is not valid.")
    }

    const result = await settlementService.settleMarket(userId!, marketId)
    return res.status(200).json({
      success: true,
      message: "Market settled successfully.",
      data: result
    })
  } catch (error) {
    next(error)
  }
}



export const getMarketSettlement = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { marketId } = req.params;
    if(!marketId || typeof marketId !== "string"){
      throw new AppError(400, "MarketId is not valid.")
    }
    const result = marketSettlementSchema.safeParse(req.query);
    if(!result.success){
      throw new AppError(400, result.error.issues[0]?.message!)
    }
    const settlement = await settlementService.getMarketSettlement(marketId, result.data);
    return res.status(200).json({
      success: true,
      message: "Market settled successfully.",
      data: settlement
    })
  } catch (error) {
    next(error)
  }
}