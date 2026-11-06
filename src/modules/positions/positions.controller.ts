import type { NextFunction, Request, Response } from 'express';
import * as positionService from './positions.service';

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