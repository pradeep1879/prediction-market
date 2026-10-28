import type { Request, Response } from "express";
import { marketSchema } from "../types/market.types";
import { prisma } from "../db/client";


export const createMarket = async (req:Request, res:Response) => {
  const result = marketSchema.safeParse(req.body);
  const { userId } = req;
  if(!result.success){
    throw new Error("Market types are not valid")
  }
  if (!userId) {
    throw new Error("User ID is required");
  }
  try {
    const isMarketExit = await prisma.market.findFirst({
      where:{
        title: result.data.title
      }
    });
    if(isMarketExit){
      return res.status(400).json({
        success: false,
        message: "Market already exit with this title",
      });
    }

    const newMarket = await prisma.market.create({
      data:{
        createrId: userId,
        title: result.data.title,
        initialWager: result.data.initialWager,
        expiry: result.data.expiry,
        resolution: result.data.resolution,
        bet: result.data.bet
      }
    });

    res.status(200).json({
      success: true,
      message: "Market created successfully",
      market: newMarket
    });

  } catch (error:any) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}