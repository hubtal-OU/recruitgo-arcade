export interface Question {
  _id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  category?: string;
  difficulty?: number;
}

export interface GameState {
  questions: Question[];
  currentQuestionIndex: number;
  scores: {
    player1: number;
    player2: number;
  };
  startTime: number;
  isActive: boolean;
}

export interface Player {
  id: string;
  name: string;
  score: number;
} 