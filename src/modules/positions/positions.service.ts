import { prisma } from "../../db/client";
import { AppError } from "../../utils/AppError";

interface GetUserPositionsParams {
  marketId?: string;
  outcome?: "YES" | "NO";
  page?: number;
  limit?: number;
}



export const getUserPositions = async (
  userId:string, 
  query:GetUserPositionsParams
) => {
  const {
    marketId,
    outcome,
    page = 1,
    limit = 10,
  }  = query

  if(page < 1 || limit < 1 || limit > 100){
    throw new AppError(400, "Invalid pagination parameters");
  }

  // build filters
  const where = {
    userId,
    ...(marketId && { marketId }),
    ...(outcome && { outcome }),
  };

  // fetch positions and total counts
  const [positions, total] = await prisma.$transaction([
    prisma.position.findMany({
      where,
      include: {
        market : {
          select: {
            id: true,
            title: true,
            status: true,
            payoutPerContract: true,
            resolution: true,
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.position.count({
      where
    })
  ]);

  // calculate available quantity
  const formattedPositions = positions.map((position) => ({
    ...position,
    availableQuantity: position.quantity - position.lockedQuantity
  }));

  // return response
  return {
    positions: formattedPositions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }
}

export const getPositionById = async (
  userId:string,
  positionId: string,
) => {
  
}