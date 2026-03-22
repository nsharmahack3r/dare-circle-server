import { Room, Player, GameStatus, TruthOrDare, SpinResult, SpinState } from "../types/game.types";
import { getRandomQuestion } from "./questions";

class GameManager {
  private rooms: Map<string, Room> = new Map();

  private generateCode(): string {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
  }

  createRoom(hostId: string, hostName: string): Room {
    const code = this.generateCode();
    const host: Player = { id: hostId, name: hostName, hasPlayed: false };

    const room: Room = {
      code,
      hostId,
      players: [host],
      status: GameStatus.WAITING,
      spinCount: 0,
      spinState: SpinState.IDLE,
    };

    this.rooms.set(code, room);
    return room;
  }

  joinRoom(code: string, playerId: string, playerName: string): Player | null {
    const room = this.rooms.get(code);
    if (!room) return null;
    if (room.status !== GameStatus.WAITING) return null;

    // Prevent duplicate joins
    const existing = room.players.find((p) => p.id === playerId);
    if (existing) return existing;

    const player: Player = { id: playerId, name: playerName, hasPlayed: false };
    room.players.push(player);
    return player;
  }

  updateSocketId(code: string, playerId: string, socketId: string) {
    const room = this.rooms.get(code);
    if (!room) return;
    const player = room.players.find((p) => p.id === playerId);
    if (player) player.socketId = socketId;
  }

  startGame(code: string, requesterId: string): { success: boolean; error?: string } {
    const room = this.rooms.get(code);
    if (!room) return { success: false, error: "Room not found" };
    if (room.hostId !== requesterId) return { success: false, error: "Only the host can start the game" };
    if (room.players.length < 2) return { success: false, error: "Need at least 2 players to start" };
    if (room.status !== GameStatus.WAITING) return { success: false, error: "Game already started" };

    room.status = GameStatus.PLAYING;
    room.spinState = SpinState.IDLE;
    return { success: true };
  }

  /**
   * Spin the wheel — randomly picks a player as the target.
   * Only the host can spin.
   */
  spin(code: string, requesterId: string): { success: boolean; error?: string; result?: SpinResult } {
    const room = this.rooms.get(code);
    if (!room) return { success: false, error: "Room not found" };
    if (room.hostId !== requesterId) return { success: false, error: "Only the host can spin" };
    if (room.status !== GameStatus.PLAYING) return { success: false, error: "Game is not in progress" };
    if (room.spinState !== SpinState.IDLE) return { success: false, error: "Wait for the current turn to finish" };

    // Randomly pick any player (can land on same person twice — it's a party game!)
    const idx = Math.floor(Math.random() * room.players.length);
    const target = room.players[idx];

    room.spinCount += 1;
    room.spinState = SpinState.SPINNING;

    const result: SpinResult = {
      targetPlayerId: target.id,
      targetPlayerName: target.name,
      spinNumber: room.spinCount,
    };

    room.currentSpin = result;
    return { success: true, result };
  }

  /**
   * Called after frontend spin animation finishes — moves state to LANDED.
   */
  spinLanded(code: string): void {
    const room = this.rooms.get(code);
    if (!room) return;
    if (room.spinState === SpinState.SPINNING) {
      room.spinState = SpinState.LANDED;
    }
  }

  /**
   * Target player chooses truth or dare.
   */
  choose(
    code: string,
    playerId: string,
    choice: TruthOrDare
  ): { success: boolean; error?: string } {
    const room = this.rooms.get(code);
    if (!room) return { success: false, error: "Room not found" };
    if (room.spinState !== SpinState.LANDED) return { success: false, error: "Not your turn yet" };
    if (!room.currentSpin) return { success: false, error: "No active spin" };
    if (room.currentSpin.targetPlayerId !== playerId) {
      return { success: false, error: "You are not the target this round" };
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return { success: false, error: "Player not found" };

    player.choice = choice;
    player.question = getRandomQuestion(choice);
    player.hasPlayed = true;
    room.spinState = SpinState.ANSWERING;

    return { success: true };
  }

  /**
   * Host marks the current turn as complete, resetting for next spin.
   */
  completeTurn(code: string, requesterId: string): { success: boolean; error?: string } {
    const room = this.rooms.get(code);
    if (!room) return { success: false, error: "Room not found" };
    if (room.hostId !== requesterId) return { success: false, error: "Only the host can complete a turn" };
    if (room.spinState !== SpinState.ANSWERING) return { success: false, error: "No active answer to complete" };

    // Clear per-turn data but keep spin count
    if (room.currentSpin) {
      const player = room.players.find((p) => p.id === room.currentSpin!.targetPlayerId);
      if (player) {
        player.choice = undefined;
        player.question = undefined;
        player.hasPlayed = false;
      }
    }

    room.currentSpin = undefined;
    room.spinState = SpinState.IDLE;

    return { success: true };
  }

  endGame(code: string, requesterId: string): { success: boolean; error?: string } {
    const room = this.rooms.get(code);
    if (!room) return { success: false, error: "Room not found" };
    if (room.hostId !== requesterId) return { success: false, error: "Only the host can end the game" };

    room.status = GameStatus.FINISHED;
    return { success: true };
  }

  removePlayer(code: string, playerId: string): void {
    const room = this.rooms.get(code);
    if (!room) return;
    room.players = room.players.filter((p) => p.id !== playerId);

    // If host left, assign next player as host (if any)
    if (room.hostId === playerId && room.players.length > 0) {
      room.hostId = room.players[0].id;
    }

    if (room.players.length === 0) {
      this.rooms.delete(code);
    }
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code);
  }

  getRoomBySocketId(socketId: string): { room: Room; player: Player } | null {
    for (const room of this.rooms.values()) {
      const player = room.players.find((p) => p.socketId === socketId);
      if (player) return { room, player };
    }
    return null;
  }
}

export default new GameManager();
