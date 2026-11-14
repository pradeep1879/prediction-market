import { prisma } from "../../db/client"
import { AppError } from "../../utils/AppError";

type CreateMarketResolutionInput = {
  outcome: "YES" | "NO",
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

export const confirmMarketResolution = async (
  userId: string,
  resolutionId: string,
) => {
  const resolution = await prisma.marketResolution.findUnique({
    where:{
      id: resolutionId
    },
    include:{
      market: true
    }
  });

  if(!resolution){
    throw new AppError(404, "Resolution not found.")
  }


  // check authorization
  const user = await prisma.user.findUnique({
    where:{
      id: userId
    },
    select:{
      id: true,
      role: true,
      status: true,
    }
  });

  if(!user || user.status !== "ACTIVE"){
    throw new AppError(403, "User is not authorized")
  }

  if(user.role !== "ADMIN"){
    throw new AppError(403, "Only admin can confirm the resolution.")
  }

  if(resolution.resolvedBy === userId){
    throw new AppError(403, "You cann't confirm your own resolution.")
  }

  // check resolution status
  if(resolution.status !== "PROPOSED"){
    throw new AppError(400, "Only proposed resolution can be confirmed.")
  }

  if(resolution.market.status !== "CLOSED"){
    throw new AppError(400, "Market must be closed before confirmation.")
  }

  // cofirm resolution and update market
  return prisma.$transaction(async(tx) => {
    const updatedResolution = await tx.marketResolution.update({
      where:{ id: resolutionId },
      data:{
        confirmedBy: userId,
        status: "CONFIRMED",
        createdAt: new Date()
      }
    });

    await tx.market.update({
      where: { id: resolution.marketId },
      data:{
        status: "RESOLVED",
        resolution: resolution.outcome,
      }
    })


    return updatedResolution
  })
}