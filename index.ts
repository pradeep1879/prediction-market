import "dotenv/config";
import express from 'express'
import userRouter from './src/modules/user/user.routes';
import marketRouter from "./src/modules/market/market.routes";
import depositeRouter from "./src/modules/deposite/deposite.routes";
import splitMarketRouter from "./src/modules/splitAndMerge/split.routes"
import positionsRouter from './src/modules/positions/positions.routes'
import orderRouter from './src/modules/order/order.routes'
import orderBookRouter from './src/modules/orderBook/orderBook.routes'
import { errorMiddleware } from "./src/middleware/error.middleware";
const app = express();

app.use(express.json());

app.use("/api/v1/user", userRouter);
app.use("/api/v1/market", marketRouter);
app.use("/api/v1/deposite", depositeRouter);
app.use("/api/v1/markets", splitMarketRouter);
app.use("/api/v1/positions", positionsRouter);
app.use("/api/v1/order", orderRouter);
app.use("/api/v1/orderBook", orderBookRouter);


app.use(errorMiddleware);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`)
})