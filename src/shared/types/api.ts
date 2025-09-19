// Legacy counter types (keeping for compatibility)
export type InitResponse = {
  type: 'init';
  postId: string;
  count: number;
  username: string;
};

export type IncrementResponse = {
  type: 'increment';
  postId: string;
  count: number;
};

export type DecrementResponse = {
  type: 'decrement';
  postId: string;
  count: number;
};

// Static Frontier Game Types
export type Phrase = {
  frequency: number;
  modulation: number;
  text: string;
};

export type Broadcast = {
  broadcastId: string;
  title: string;
  metaAnswer: string;
  phrases: Phrase[];
};

export type GameState = {
  broadcast: Broadcast;
  foundPhrases: string[];
  isMetaSolved: boolean;
  winner?: string;
  asciiMap: string[][];
  userEchoPoints: number;
};

export type PhraseFoundResponse = {
  success: boolean;
  phrase?: string;
  message: string;
};

export type MetaSolveResponse = {
  success: boolean;
  isWinner: boolean;
  echoPoints?: number;
  message: string;
};

export type MapResponse = {
  asciiMap: string[][];
  winner?: string;
};
