import { Server, Socket } from "socket.io";
import GameManager from "./game/GameManager";
import { TruthOrDare, GameEvent } from "./types/game.types";

export default function socketHandler(io: Server) {
  io.on("connection", (socket: Socket) => {
    // JOIN ROOM
    socket.on("join-room", ({ code }) => {
      socket.join(code);

      const room = GameManager.getRoom(code);
      if (room) {
        socket.emit(GameEvent.ROOM_UPDATE, room);
      }
    });

    // START GAME
    socket.on("start-game", ({ code, playerId }) => {
      const room = GameManager.getRoom(code);
      if (!room) return;

      if (room.hostId !== playerId) {
        return socket.emit(GameEvent.ERROR, "Only host can start");
      }

      GameManager.startGame(code);
      io.to(code).emit(GameEvent.ROOM_UPDATE, room);
    });

    // CHOOSE
    socket.on("choose", ({ code, playerId, choice }) => {
      const room = GameManager.getRoom(code);
      if (!room) return;

      const currentPlayer = room.players[room.currentPlayerIndex];

      // enforce turn
      if (currentPlayer.id !== playerId) {
        return socket.emit(GameEvent.ERROR, "Not your turn");
      }

      GameManager.choose(code, playerId, choice as TruthOrDare);
      io.to(code).emit(GameEvent.ROOM_UPDATE, room);
    });

    // COMPLETE TURN
    socket.on("complete-turn", ({ code, playerId }) => {
      const room = GameManager.getRoom(code);
      if (!room) return;

      const currentPlayer = room.players[room.currentPlayerIndex];

      if (currentPlayer.id !== playerId) {
        return socket.emit(GameEvent.ERROR, "Not your turn");
      }

      GameManager.nextTurn(code);
      io.to(code).emit(GameEvent.ROOM_UPDATE, room);
    });

    // DISCONNECT HANDLING
    socket.on("disconnect", () => {
      // (optional improvement)
      // track socket → player mapping for cleanup
    });
  });
}
