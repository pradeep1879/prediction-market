import { prisma } from "../../db/client"
import { AppError } from "../../utils/AppError";

type CreateMarketResolutionInput = {
  outcome?: "YES" | "NO",
  resolutionSource?: string,
}

export const createMarketResolution = async (
  userId: string, 
  marketId: string, 
  query: CreateMarketResolutionInput
) => {

  const { outcome, resolutionSource } = query;

  const market = await prisma.market.findUnique({
    where:{
      id: marketId
    }
  });

  if(!market){
    throw new AppError(404, "Market does not exits.")
  }

  if(userId !== market.creatorId){
    throw new AppError(403, "Not authorized to resolve this market.")
  }
  
  if(market.status !== "CLOSED"){
    throw new AppError(400, "Market is not closed yet.")
  }
  
  // check existing resolution
  const exisitingResolution = await prisma.market.findFirst({
    where:{
      id: marketId,
      status: {
        in: ["DRAFT", "RESOLVED"]
      }
    }
  });

  if(exisitingResolution){
    throw new AppError(400, "A resolution already exits for this market.")
  }

  // create resolution
  const resolution = await prisma.marketResolution.create({
    data:{
      marketId,
      resolvedBy: userId,
      resolutionSource,
      outcome,
      status: "PROPOSED"
    }
  });

  return resolution
}