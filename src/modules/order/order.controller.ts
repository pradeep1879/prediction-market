import type { NextFunction, Request, Response } from "express";
import * as orderService from '../order/order.service'
import { getUserOrdersSchema, placeOrderSchema } from "./order.schema";
import { AppError } from "../../utils/AppError";

export const placeOrder = async (req: Request, res: Response, next: NextFunction) =>{
  try {
    const userId = req.userId;
    const { marketId } = req.params
    if(!marketId || typeof marketId !== "string"){
      throw new AppError(400, "marketId can't be empty")
    }
    const result = placeOrderSchema.safeParse(req.body);
    if(!result.success){
      throw new AppError(400, result.error.issues[0]?.message!)
    }

    const order = await orderService.placeOrder(userId!, marketId, result.data);

    return res.status(201).json({
      success: true,
      message: "Your order created successfully",
      data: order
    })
  } catch (error) {
    next(error)
  }
}


export const getUserOrders = async(req: Request, res: Response, next: NextFunction) => {
  try {
    const { marketId } = req.params;
    if(!marketId || typeof marketId !== "string"){
      throw new AppError(400, "marketId is not valid")
    }
    const result = getUserOrdersSchema.safeParse(req.query);
    if(!result.success){
      throw new AppError(400, result.error.issues[0]?.message!);
    }
    const orders = await orderService.getUserOrders(
      req.userId!,
      marketId,
      result.data
    )
    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: orders
    })
  } catch (error) {
    next(error)
  }
}

export const getOrderById = async (req:Request, res:Response, next:NextFunction) => {
 try {
  const userId = req.userId;
  const { orderId } = req.params;

  if(!orderId || typeof orderId !== "string"){
    throw new AppError(400, "orederId is not valid.")
  }

  const order = await orderService.getOrderById(userId!, orderId);
  return res.status(200).json({
    success: true,
    message: "Oreder fetched successfully",
    data: order
  })
 } catch (error) {
  next(error)
 }
}