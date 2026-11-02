import { AppError } from '../../utils/AppError';
import { mergeSchema, splitSchema } from './split.schema';
import * as splitMergeService from './split.service';
import type { NextFunction, Request, Response } from "express";

export const splitMarket = async (req:Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const { marketId } = req.params;
    const { data, success, error } = splitSchema.safeParse(req.body);
    if(typeof marketId !== "string" || !marketId){
      throw new AppError(400, "marketId is not valid")
    }
    if(!success){
      throw new AppError(400, error.issues[0]?.message!)
    }

    const result = await splitMergeService.splitMarket(userId!, marketId, data.quantity);

    return res.status(201).json({
      success: true,
      message: "Market split successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export const mergeMarket = async (req:Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const { marketId } = req.params;
    const { data, success, error } = mergeSchema.safeParse(req.body);
    if(typeof marketId !== "string" || !marketId){
      throw new AppError(400, "marketId is not valid")
    }
    if(!success){
      throw new AppError(400, error.issues[0]?.message!)
    }

    const result = await splitMergeService.mergeMarket(userId!, marketId, data.quantity);

    return res.status(201).json({
      success: true,
      message: "Market merged successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}