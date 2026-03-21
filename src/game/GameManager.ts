import { v4 as uuidv4 } from "uuid";
import { Room, Player, GameStatus, TruthOrDare } from "../types/game.types";
import { getRandomQuestion } from "./questions";

class GameManager {
  private rooms: Map<string, Room> = new Map();

  private generateCode() {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
  }

  createRoom(hostName: string): Room {
    const code = this.generateCode();
    const host: Player = {
      id: uuidv4(),
      name: hostName,
      hasPlayed: false
    };

    const room: Room = {
      code,
      hostId: host.id,
      players: [host],
      status: GameStatus.WAITING,
      currentPlayerIndex: 0
    };

    this.rooms.set(code, room);
    return room;
  }

  joinRoom(code: string, name: string): Player | null {
    const room = this.rooms.get(code);
    if (!room) return null;

    const player: Player = {
      id: uuidv4(),
      name,
      hasPlayed: false
    };

    room.players.push(player);
    return player;
  }

  startGame(code: string) {
    const room = this.rooms.get(code);
    if (!room) return;

    room.status = GameStatus.PLAYING;
    room.currentPlayerIndex = 0;
  }

  choose(code: string, playerId: string, choice: TruthOrDare) {
    const room = this.rooms.get(code);
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return;

    player.choice = choice;
    player.question = getRandomQuestion(choice);
    player.hasPlayed = true;
  }

  nextTurn(code: string) {
    const room = this.rooms.get(code);
    if (!room) return;

    room.currentPlayerIndex++;

    if (room.currentPlayerIndex >= room.players.length) {
      room.status = GameStatus.FINISHED;
    }
  }

  getRoom(code: string) {
    return this.rooms.get(code);
  }
}

export default new GameManager();
