import type { NextFunction, Request, Response } from 'express';
import * as resolutionService from '../resolution/resolution.service';
import { AppError } from '../../utils/AppError';
import { marketResoultionSchema } from './resolution.schema';


export const createMarketResolution = async (
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
    const result = marketResoultionSchema.safeParse(req.query);
    if(!result.success){
      throw new AppError(400, result.error.issues[0]?.message!)
    }
    const resolution = await resolutionService.createMarketResolution(userId!, marketId, result.data)

    return res.status(201).json({
      success: true,
      message: "Market resolution created successfully.",
      data: resolution
    })

  } catch (error) {
    next(error)
  }
}


export const confirmMarketResolution = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const { resolutionId } = req.params;

    if(!resolutionId || typeof resolutionId !== "string"){
      throw new AppError(400, "resolutionId is not valid.")
    }
    const resolution = await resolutionService.confirmMarketResolution(userId!, resolutionId)

    return res.status(201).json({
      success: true,
      message: "Market resolution cofirmed successfully.",
      data: resolution
    })

  } catch (error) {
    next(error)
  }
}