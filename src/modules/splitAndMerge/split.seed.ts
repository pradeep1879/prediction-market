import { prisma } from "../../db/client";


const wallets = await prisma.wallet.findMany();

for (const wallet of wallets) {
  await prisma.ledgerAccount.createMany({
    data: [
      {
        walletId: wallet.id,
        accountType: "USER_AVAILABLE",
      },
      {
        walletId: wallet.id,
        accountType: "USER_RESERVED",
      },
    ],
    skipDuplicates: true,
  });
}

// Create missing market accounts
const markets = await prisma.market.findMany();

for (const market of markets) {
  await prisma.ledgerAccount.createMany({
    data: [
      {
        marketId: market.id,
        accountType: "MARKET_COLLATERAL",
      },
    ],
    skipDuplicates: true,
  });
}