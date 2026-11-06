import type { NextFunction, Request, Response } from 'express';
import * as positionService from './positions.service';
import { AppError } from '../../utils/AppError';

export const getUserPositions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;

    const result = await positionService.getUserPositions(
      userId!,
      req.query
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getPositionById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { positionId } = req.params;
    if(!positionId || typeof positionId !== "string"){
      throw new AppError(404, "Position Id can't be empty")
    }

    const position = await positionService.getPositionById(
      req.userId!,
      positionId
    );

    return res.status(200).json({
      success: true,
      data: position,
    });
  } catch (error) {
    next(error);
  }
};