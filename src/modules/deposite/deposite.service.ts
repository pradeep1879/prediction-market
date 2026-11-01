import { prisma } from "../../db/client"
import { AppError } from "../../utils/AppError"

export const deposite = async (userId: string, amount: number) =>{
  if(!userId){
    throw new AppError(404, "UserId cannot be empty.")
  }

  const wallet = await prisma.wallet.findUnique({
    where:{
      userId
    }
  });

  if(!wallet){
    throw new AppError(404, "Wallet does not exits for this user.")
  }

  if (wallet.status !== "ACTIVE") {
    throw new AppError(403, "Wallet is not active");
  }

  return prisma.$transaction(async (tx) => {
    const deposit = await tx.deposit.create({
      data: {
        amount,
        walletId: wallet.id,
        status: "COMPLETED",
        completedAt: new Date(),
        provider: "rzp",
        providerOrderId: `rzp_orderId_${crypto.randomUUID()}`,
        providerPaymentId: `rzp_paymentId_${crypto.randomUUID()}`,
      },
    });

    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        availableBalance: {
          increment: amount,
        },
      },
    });

    return {
      deposit,
      wallet: updatedWallet,
    };
  });
}
