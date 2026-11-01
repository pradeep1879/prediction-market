import type { Market } from "../../../generated/prisma/client";
import { AppError } from "../../utils/AppError";

export const validateMarketOpening  = (market:Market): void => {
  const now = new Date();

  if(market.tradingStartsAt <= now){
    throw new AppError(400, "Trading start time must be in the future")
  }

  if(market.tradingEndsAt <= market.tradingStartsAt){
    throw new AppError(400, "Trading end time must be after start time.")
  }

  if(market.expiresAt <= market.tradingEndsAt){
    throw new AppError(400, "Expiry time must be after trading end time.")
  }

  if (market.payoutPerContract <= 0) {
    throw new AppError(400, "Payout per contract must be greater than zero");
  }

  if (
    market.minPrice <= 0 ||
    market.maxPrice <= market.minPrice ||
    market.maxPrice >= market.payoutPerContract
  ) {
    throw new AppError(400, "Invalid market price configuration");
  }

  if (
     market.tickSize <= 0 ||
    (market.maxPrice - market.minPrice) % market.tickSize !== 0
  ) {
    throw new AppError(400, "Invalid market tick size");
  }

  // 7. Validate minimum order quantity
  if (market.minOrderQuantity <= 0) {
    throw new AppError(400, "Minimum order quantity must be greater than zero");
  }
}