export enum GameStatus {
  WAITING = "waiting",
  PLAYING = "playing",
  FINISHED = "finished",
}

export enum TruthOrDare {
  TRUTH = "truth",
  DARE = "dare",
}

export enum SpinState {
  IDLE = "idle",       // waiting for host to spin
  SPINNING = "spinning", // wheel animation in progress
  LANDED = "landed",   // target picked, waiting for truth/dare choice
  ANSWERING = "answering", // target chose, question assigned
}

export interface Player {
  id: string;       // userId from JWT
  name: string;
  socketId?: string;
  hasPlayed: boolean;
  choice?: TruthOrDare;
  question?: string;
}

export interface SpinResult {
  targetPlayerId: string;
  targetPlayerName: string;
  spinNumber: number;
}

export interface Room {
  code: string;
  hostId: string;
  players: Player[];
  status: GameStatus;
  spinCount: number;          // total number of spins done
  currentSpin?: SpinResult;   // result of the latest spin
  spinState: SpinState;       // controls phase of the current turn
}

export enum GameEvent {
  ROOM_UPDATE = "room:update",
  SPIN_RESULT = "spin:result",
  ERROR = "error",
}
