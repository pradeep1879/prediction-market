import "dotenv/config";
import express from 'express'
import userRouter from './src/routers/user.route';
const app = express();

app.use(express.json());

app.use("/user", userRouter);


app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`)
})