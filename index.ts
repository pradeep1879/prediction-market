import "dotenv/config";
import express from 'express'
import userRouter from './src/routers/user.route';
import marketRouter from "./src/routers/market.route";
const app = express();

app.use(express.json());

app.use("/user", userRouter);
app.use("/market", marketRouter);


app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`)
})