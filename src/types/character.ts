export type CharacterTiming = {
  baseDelayMs: number;
  mediumMessageDelayMs: number;
  longMessageDelayMs: number;
  typingSpeedMs: number;
  punctuationPauseMs: number;
};

export type CharacterPrompt = {
  system: string[];
};

export type Character = {
  id: string;
  name: string;
  alias: string;
  description: string;
  status: string;
  intro: string;
  starterQuestions: string[];
  timing: CharacterTiming;
  prompt: CharacterPrompt;
};