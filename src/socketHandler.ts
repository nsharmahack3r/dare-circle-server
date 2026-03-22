import { Server, Socket } from "socket.io";
import GameManager from "./game/GameManager";
import { TruthOrDare, GameEvent } from "./types/game.types";
import { verifySocketToken } from "./middleware/auth";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userName?: string;
}

export default function socketHandler(io: Server) {
  // Authenticate every socket connection via token in handshake
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication token required"));
    }

    const payload = verifySocketToken(token);
    if (!payload) {
      return next(new Error("Invalid or expired token"));
    }

    socket.userId = payload.userId;
    socket.userName = payload.name;
    next();
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    // JOIN ROOM
    socket.on("join-room", ({ code }) => {
      if (!socket.userId || !socket.userName) {
        return socket.emit(GameEvent.ERROR, "Not authenticated");
      }

      const room = GameManager.getRoom(code);
      if (!room) {
        return socket.emit(GameEvent.ERROR, "Room not found");
      }

      // Register socket ID for disconnect tracking
      GameManager.updateSocketId(code, socket.userId, socket.id);
      socket.join(code);
      io.to(code).emit(GameEvent.ROOM_UPDATE, room);
    });

    // START GAME
    socket.on("start-game", ({ code }) => {
      if (!socket.userId) return socket.emit(GameEvent.ERROR, "Not authenticated");

      const result = GameManager.startGame(code, socket.userId);
      if (!result.success) return socket.emit(GameEvent.ERROR, result.error);

      io.to(code).emit(GameEvent.ROOM_UPDATE, GameManager.getRoom(code));
    });

    // SPIN — host spins the wheel
    socket.on("spin", ({ code }) => {
      if (!socket.userId) return socket.emit(GameEvent.ERROR, "Not authenticated");

      const result = GameManager.spin(code, socket.userId);
      if (!result.success) return socket.emit(GameEvent.ERROR, result.error);

      // Emit spin result to all players — clients use this to animate wheel
      io.to(code).emit(GameEvent.SPIN_RESULT, result.result);
      io.to(code).emit(GameEvent.ROOM_UPDATE, GameManager.getRoom(code));
    });

    // SPIN LANDED — client fires this after animation finishes
    socket.on("spin-landed", ({ code }) => {
      GameManager.spinLanded(code);
      io.to(code).emit(GameEvent.ROOM_UPDATE, GameManager.getRoom(code));
    });

    // CHOOSE truth or dare
    socket.on("choose", ({ code, choice }) => {
      if (!socket.userId) return socket.emit(GameEvent.ERROR, "Not authenticated");

      const result = GameManager.choose(code, socket.userId, choice as TruthOrDare);
      if (!result.success) return socket.emit(GameEvent.ERROR, result.error);

      io.to(code).emit(GameEvent.ROOM_UPDATE, GameManager.getRoom(code));
    });

    // COMPLETE TURN — host confirms player answered
    socket.on("complete-turn", ({ code }) => {
      if (!socket.userId) return socket.emit(GameEvent.ERROR, "Not authenticated");

      const result = GameManager.completeTurn(code, socket.userId);
      if (!result.success) return socket.emit(GameEvent.ERROR, result.error);

      io.to(code).emit(GameEvent.ROOM_UPDATE, GameManager.getRoom(code));
    });

    // END GAME
    socket.on("end-game", ({ code }) => {
      if (!socket.userId) return socket.emit(GameEvent.ERROR, "Not authenticated");

      const result = GameManager.endGame(code, socket.userId);
      if (!result.success) return socket.emit(GameEvent.ERROR, result.error);

      io.to(code).emit(GameEvent.ROOM_UPDATE, GameManager.getRoom(code));
    });

    // DISCONNECT — remove player from room
    socket.on("disconnect", () => {
      const found = GameManager.getRoomBySocketId(socket.id);
      if (found) {
        const { room, player } = found;
        GameManager.removePlayer(room.code, player.id);
        const updatedRoom = GameManager.getRoom(room.code);
        if (updatedRoom) {
          io.to(room.code).emit(GameEvent.ROOM_UPDATE, updatedRoom);
        }
      }
    });
  });
}
