import { AppError } from '../../utils/AppError';
import * as marketService from './market.service';
import type { NextFunction, Request, Response } from "express";

export const createMarket = async (req:Request, res: Response, next: NextFunction) => {
  try {
    const market = await marketService.createMarket(req.body, req.userId!);

    return res.status(201).json({
      success: true,
      message: "Market created successfully",
      data: market,
    });
  } catch (error) {
    next(error);
  }
}


export const getMarkets = async (req:Request, res: Response, next: NextFunction) => {
  try {
    const markets = await marketService.getMarkets(req.userId!);

    return res.status(200).json({
      success: true,
      message: "All Markets",
      data: markets,
    });
  } catch (error) {
    next(error);
  }
}


export const getMarket = async (req:Request, res: Response, next: NextFunction) => {
  try {
    const { marketId } = req.params;
    if(typeof marketId !== "string"){
      throw new AppError(400, "Invalid marketId")
    }
    const market = await marketService.getMarket(marketId);

    return res.status(200).json({
      success: true,
      message: "Market",
      data: market,
    });
  } catch (error) {
    next(error);
  }
}

export const openMarket = async (req:Request, res: Response, next: NextFunction) => {
  try {
    const { marketId } = req.params;
    const userId = req.userId
    if(typeof marketId !== "string"){
      throw new AppError(400, "Invalid marketId")
    }
    const market = await marketService.openMarket(marketId, userId!);

    return res.status(200).json({
      success: true,
      message: "Market opened successfully",
      data: market,
    });
  } catch (error) {
    next(error);
  }
}


export const closeMarket = async (req:Request, res: Response, next: NextFunction) => {
  try {
    const { marketId } = req.params;
    const userId = req.userId
    if(typeof marketId !== "string"){
      throw new AppError(400, "Invalid marketId")
    }
    const market = await marketService.closeMarket(marketId, userId!);

    return res.status(200).json({
      success: true,
      message: "Market closed successfully",
      data: market,
    });
  } catch (error) {
    next(error);
  }
}