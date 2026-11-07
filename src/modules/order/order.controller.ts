import type { NextFunction, Request, Response } from "express";
import * as orderService from '../order/order.service'
import { placeOrderSchema } from "./order.schema";
import { AppError } from "../../utils/AppError";

export const placeOrder = async (req: Request, res: Response, next: NextFunction) =>{
  try {
    const userId = req.userId;
    const result = placeOrderSchema.safeParse(req.body);
    if(!result.success){
      throw new AppError(400, result.error.issues[0]?.message!)
    }

    const order = await orderService.placeOrder(userId, result.data);

    return res.status(201).json({
      success: true,
      message: "Your order created successfully"
      data: order
    })
  } catch (error) {
    
  }
}