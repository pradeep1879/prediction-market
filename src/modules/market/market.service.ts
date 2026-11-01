import { prisma } from "../../db/client";
import { AppError } from "../../utils/AppError";
import { validateMarketOpening } from "./market";
import { marketSchema } from "./market.schema"

export const createMarket = async (body: unknown, userId: string) => {
  const { data, success, error } = marketSchema.safeParse(body);

  if (!success) {
    throw new AppError(400, error.issues[0]!.message);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new AppError(404, "User does not exist");
  }

  const isMarketExist = await prisma.market.findFirst({
    where: { title: data.title },
  });

  if (isMarketExist) {
    throw new AppError(409, "Market with this title already exists");
  }

  const result = await prisma.$transaction(async (tx) => {
    // create market
    const market = await tx.market.create({
      data: {
        creatorId: userId,
        title: data.title,
        description: data.description,
        expiresAt: data.expiresAt,
        tradingStartsAt: data.tradingStartsAt,
        tradingEndsAt: data.tradingEndsAt,
      },
    });

    // create market collateral ledger account
    const ledgerAccount = await tx.ledgerAccount.create({
      data: {
        marketId: market.id,
        accountType: "MARKET_COLLATERAL",
      },
    });

    return {
      market,
      ledgerAccount,
    };
  });

  return result;
};


export const getMarkets = async (userId:string) => {
  const allmarkets = await prisma.market.findMany({});
  return allmarkets;
}


export const getMarket = async (marketId:string) => {
  if(!marketId){
    throw new AppError(404, "MarketId does not exits or invalid market id");
  }

  const isMarketExit = await prisma.market.findUnique({
    where:{ id : marketId }
  })

  if(!isMarketExit){
    throw new AppError(404, "Market does not exits.");
  }

  const market = await prisma.market.findUnique({
    where: { id: marketId }
  })

  return market;
}

export const openMarket = async (marketId: string, userId: string) => {
  const market = await prisma.market.findUnique({
    where: { id: marketId }
  });
  if(!market){
    throw new AppError(404, "Market does not exits.");
  }
  if(market?.creatorId !== userId){
    throw new AppError(400, "Only market creater can open the market.")
  }

  if(market.status !== "DRAFT"){
    throw new AppError(400, "Market cannot be opened")
  }

  validateMarketOpening(market)

  return await prisma.market.update({
    where: { id: marketId },
    data:  { status: "OPEN"}
  });
}



export const closeMarket = async (marketId: string, userId: string) => {
  const market = await prisma.market.findUnique({
    where: { id: marketId }
  });
  if(!market){
    throw new AppError(404, "Market does not exits.");
  }
  if(market?.creatorId !== userId){
    throw new AppError(403, "Only market creater can close the market.")
  }

  if(market.status !== "OPEN"){
    throw new AppError(400, "Market is be open")
  }
  
  const closeMarket = await prisma.market.update({
    where: { id: marketId },
    data: { status: "CLOSED" }
  });

  return closeMarket
}