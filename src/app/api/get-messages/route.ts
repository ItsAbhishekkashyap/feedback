import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import dbConnect from "@/lib/dbconnect";
import UserModel from "@/model/user";
import { User } from "next-auth";
import mongoose from "mongoose";

export async function GET(request: Request){
    await dbConnect()
    const session = await getServerSession(authOptions)
    const user: User = session?.user

    if (!session || !session.user) {
        return Response.json(
            {
                success: false,
                message: "Not Authenticated"
            },
            { status: 401 }
        )
    }

    const userId = new mongoose.Types.ObjectId(user._id);
    // ynha pe agr user._id string me bhi hua to mongoose ke object id me convert hoke jayega aur yhi hme chahiye.

    try {

        // here we are going to work on agreegation pipeline.
        const user = await UserModel.aggregate([
            {$match: {id: userId}},
            {$unwind: '$messages'},
            {$sort: {'messages.createdAt': -1}},
            {$group: {_id: '$_id', messages: {$push: '$messages'}}}
        ])

        if (!user || user.length === 0){
            return Response.json(
                {
                    success: false,
                    message: "User not found"
                },
                { status: 401 }
            )
        }

        return Response.json(
            {
                success: true,
                message: user[0].messages
            },
            { status: 200 }
        )


    } catch (error) {
        console.log("An unexpected error occured:", error)
        return Response.json(
            {
                success: false,
                message: "Not authenticated"
            },
            { status: 500 }
        )
    }
}
