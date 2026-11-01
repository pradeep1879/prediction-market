import { AppError } from '../../utils/AppError';
import { depositeSchema } from './deposite.schema';
import * as depositeService from './deposite.service';
import type { NextFunction, Request, Response } from "express";

export const deposite = async (req:Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const { data, success, error } = depositeSchema.safeParse(req.body);
    if(!success){
      throw new AppError(400, error.issues[0]?.message!)
    }
    const result = await depositeService.deposite(userId!, data.amount);

    return res.status(201).json({
      success: true,
      message: "Deposite created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}