
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken";
import { userSignIn, userSignUp } from "./user.schema";
import { prisma } from "../../db/client";
import { AppError } from "../../utils/AppError";



export const signup = async (body:unknown) => {
  console.log("user signup", body)
  const { data, success, error } = userSignUp.safeParse(body);

  if (!success) {
    throw new AppError(400, error.issues[0]!.message);
  }

  const { username, password } = data;

  const isUserExist = await prisma.user.findUnique({
    where: { username },
  });

  if (isUserExist) {
    throw new AppError(409, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
    },
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true,
    },
  });

  // create wallet of user at time of user signup
  const wallet = await prisma.wallet.create({
    data:{
      userId: newUser.id
    }
  })

  return {
    newUser,
    wallet
  } 
}

export const signin = async (body: unknown) => {
  const {data, success, error} = userSignIn.safeParse(body);
  if(!success){
    throw new AppError(404, error.issues[0]?.message!)
  }

  const isUserExist = await prisma.user.findUnique({
    where: { username: data.username }
  });
  if(!isUserExist){
    throw new AppError(404, "User does not exit with username");
  }

  const isPasswordCorrect = await bcrypt.compare(data.password, isUserExist.password)
  if(!isPasswordCorrect){
    throw new AppError(400, "Password is not correct");
  }

  const token = jwt.sign(
    {userId: isUserExist.id}, 
    process.env.JWT_SECRET!
  );
  return {
    user: isUserExist, 
    token
  }
}



// export const addBalance = async (req:Request, res:Response) => {
//   const result = userBalance.safeParse(req.body);
//   const { userId } = req;
//   if(!success){
//     throw new Error("Invalid balance")
//   }
//   try {
//     const user = await prisma.user.findFirst({
//       where:{
//         id: userId
//       }
//     });
//     if(!user){
//       return res.status(400).json({
//         success: false,
//         message: "User does not exit"
//       });
//     }


//     const updateUserBalance = await prisma.user.update({
//       where:{
//         id: userId
//       },
//       data:{
//         balance: {
//           increment: result.data.balance
//         }
//       }
//     });
//     res.status(200).json({
//       success: true,
//       message: "User Balance updated",
//       user: updateUserBalance
//     });

//   } catch (error:any) {
//     return res.status(400).json({
//       success: false,
//       message: error.message
//     });
//   }
// }

// export const getUserProfile = async (req:Request, res:Response) => {
//   const { userId } = req;
//   try {
//     const isUserExist = await prisma.user.findFirst({
//       where:{
//         id: userId
//       }
//     });
//     if(!isUserExist){
//       return res.status(400).json({
//         success: false,
//         message: "User does not exits"
//       });
//     }

//     const userProfile = await prisma.user.findFirst({
//       where:{
//         id: userId
//       },
//     });

//     res.status(200).json({
//       success: true,
//       message: "User Profile",
//       user: userProfile
//     })
//   } catch (error:any) {
//     return res.status(400).json({
//       success: false,
//       message: error.message
//     });
//   }
// }

