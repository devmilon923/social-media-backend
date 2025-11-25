import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import mongoose from "mongoose";
import { UserModel } from "../modules/user/user.model"; // User model
import { NotificationModel } from "../modules/notifications/notification.model";
import { INotification } from "../modules/notifications/notification.interface";
import { verifySocketToken } from "./JwtToken";
import ApiError from "../errors/ApiError";
import httpStatus from "http-status";
declare module "socket.io" {
  interface Socket {
    user?: {
      _id: string;
      name: string;
      email: string;
      role: string;
    };
  }
}

// Initialize the Socket.IO server
let io: SocketIOServer;
export const connectedUsers: any = {};
export const initSocketIO = async (server: HttpServer) => {
  console.log("🔧 Initializing Socket.IO server 🔧");
  const { Server } = await import("socket.io");
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  console.log("🎉 Socket.IO server initialized! 🎉");

  io.use(async (socket: Socket, next) => {
    // Extract token from headers (ensure your client sends it in headers)
    const token = (socket.handshake.headers.token as string) || null;
    if (!token) {
      return next(
        new ApiError(
          httpStatus.UNAUTHORIZED,
          "Authentication error: Token missing",
        ),
      );
    }

    const userDetails = verifySocketToken(token);
    if (!userDetails) {
      return next(new Error("Authentication error: Invalid token"));
    }

    const user = await UserModel.findOne({
      _id: new mongoose.Types.ObjectId(userDetails.id || "n/a"),
      isDeleted: false,
      isVerified: true,
    }).select("name email role");
    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }
    socket.user = user;
    next();
  });

  io.on("connection", (socket: Socket) => {
    if (socket.user && socket.user._id) {
      connectedUsers[socket.user._id.toString()] = { socketID: socket.id };
      console.log("Socket just connected:", {
        socketId: socket.id,
        userId: socket.user?._id,
        name: socket.user?.name,
        email: socket.user?.email,
        role: socket.user?.role,
      });
    }

    socket.on("disconnect", () => {
      if (socket.user?._id) {
        console.log(
          `${socket.user?.name} || ${socket.user?.email} || ${socket.user?._id} just disconnected with socket ID: ${socket.id}`,
        );
        delete connectedUsers[socket.user?._id];
      }
    });
  });
};

// Export the Socket.IO instance
export { io };

export const emitNotification = async ({
  userId,
  adminMsgTittle,
  userMsgTittle,
  userMsg,
  adminMsg,
}: {
  userId: mongoose.Types.ObjectId;
  userMsgTittle: string;
  adminMsgTittle: string;
  userMsg?: string;
  adminMsg?: string;
}): Promise<void> => {
  if (!io) {
    throw new Error("Socket.IO is not initialized");
  }

  // Get the socket ID of the specific user
  const userSocket = connectedUsers[userId.toString()];

  // Get admin IDs
  const admins = await UserModel.find({ role: "admin" }).select("_id");
  const adminIds = admins.map((admin) => admin._id.toString());

  // Notify the specific user
  if (userMsg && userSocket) {
    io.to(userSocket.socketID).emit(`notification`, {
      userId,
      message: userMsg,
    });
  }

  // Notify all admins
  if (adminMsg) {
    adminIds.forEach((adminId) => {
      const adminSocket = connectedUsers[adminId];
      if (adminSocket) {
        io.to(adminSocket.socketID).emit(`notification`, {
          adminId,
          message: adminMsg,
        });
      }
    });
  }

  // Save notification to the database
  await NotificationModel.create<INotification>({
    userId,
    userMsg,
    adminId: adminIds,
    adminMsg,
    adminMsgTittle,
    userMsgTittle,
  });
};
