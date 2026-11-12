import type { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../db/client";
import { AppError } from "../../utils/AppError";

type OrderbookOrder = Prisma.OrderGetPayload<{
  select: {
    id: true;
    outcome: true;
    action: true;
    price: true;
    originalQuantity: true;
    filledQuantity: true;
    sequence: true;
  };
}>;

type PriceLevel = {
  price: number;
  quantity: number;
  orderCount: number;
};

type Orderbook = {
  YES: {
    BUY: PriceLevel[];
    SELL: PriceLevel[];
  };
  NO: {
    BUY: PriceLevel[];
    SELL: PriceLevel[];
  };
};

type GroupedOrders = {
  YES_BUY: OrderbookOrder[];
  YES_SELL: OrderbookOrder[];
  NO_BUY: OrderbookOrder[];
  NO_SELL: OrderbookOrder[];
};

export const getMarketOrderbook = async (marketId: string) => {
  // 1. Check market existence
  const market = await prisma.market.findUnique({
    where: {
      id: marketId,
    },
    select: {
      id: true,
      title: true,
      status: true,
    },
  });

  if (!market) {
    throw new AppError(404, "Market not found");
  }

  // 2. Fetch active orders
  const orders = await prisma.order.findMany({
    where: {
      marketId,
      status: {
        in: ["OPEN", "PARTIALLY_FILLED"],
      },
    },
    select: {
      id: true,
      outcome: true,
      action: true,
      price: true,
      originalQuantity: true,
      filledQuantity: true,
      sequence: true,
    },
    orderBy: {
      sequence: "asc",
    },
  });

  // 3. Initialize orderbook
  const orderbook: Orderbook = {
    YES: {
      BUY: [],
      SELL: [],
    },
    NO: {
      BUY: [],
      SELL: [],
    },
  };

  // 4. Group orders
  const groupedOrders: GroupedOrders = {
    YES_BUY: [],
    YES_SELL: [],
    NO_BUY: [],
    NO_SELL: [],
  };

  for (const order of orders) {
    const remainingQuantity =
      order.originalQuantity - order.filledQuantity;

    if (remainingQuantity <= 0) continue;

    const key =
      `${order.outcome}_${order.action}` as keyof GroupedOrders;

    groupedOrders[key].push(order);
  }

  // 5. Aggregate orders by price
  const aggregateOrders = (
    orders: OrderbookOrder[],
    action: "BUY" | "SELL"
  ): PriceLevel[] => {
    const priceLevels = new Map<number, PriceLevel>();

    for (const order of orders) {
      const remainingQuantity =
        order.originalQuantity - order.filledQuantity;

      const existing = priceLevels.get(order.price);

      if (existing) {
        existing.quantity += remainingQuantity;
        existing.orderCount += 1;
      } else {
        priceLevels.set(order.price, {
          price: order.price,
          quantity: remainingQuantity,
          orderCount: 1,
        });
      }
    }

    const result = Array.from(priceLevels.values());

    // BUY: highest price first
    // SELL: lowest price first
    return result.sort((a, b) =>
      action === "BUY"
        ? b.price - a.price
        : a.price - b.price
    );
  };

  // 6. Build YES and NO orderbooks
  orderbook.YES.BUY = aggregateOrders(
    groupedOrders.YES_BUY,
    "BUY"
  );

  orderbook.YES.SELL = aggregateOrders(
    groupedOrders.YES_SELL,
    "SELL"
  );

  orderbook.NO.BUY = aggregateOrders(
    groupedOrders.NO_BUY,
    "BUY"
  );

  orderbook.NO.SELL = aggregateOrders(
    groupedOrders.NO_SELL,
    "SELL"
  );

  // 7. Return orderbook
  return {
    market,
    orderbook,
  };
};