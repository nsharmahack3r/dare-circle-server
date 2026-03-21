export enum GameStatus {
  WAITING = "waiting",
  PLAYING = "playing",
  FINISHED = "finished",
}

export enum TruthOrDare {
  TRUTH = "truth",
  DARE = "dare",
}

export interface Player {
  id: string;
  name: string;
  hasPlayed: boolean;
  choice?: TruthOrDare;
  question?: string;
}

export interface Room {
  code: string;
  hostId: string;
  players: Player[];
  status: GameStatus;
  currentPlayerIndex: number;
}

export enum GameEvent {
  ROOM_UPDATE = "room:update",
  ERROR = "error",
}
