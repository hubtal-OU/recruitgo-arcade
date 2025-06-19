import { Server, Socket } from 'socket.io';
import { Question } from './models/Question';
import { GameState } from './types';

const gameStates: Map<string, GameState> = new Map();

export const setupGameHandlers = (io: Server, socket: Socket) => {
  // Start a new game
  socket.on('startGame', async () => {
    try {
      const questions = await Question.aggregate([
        { $sample: { size: 10 } }
      ]);
      
      const gameState: GameState = {
        questions,
        currentQuestionIndex: 0,
        scores: { player1: 0, player2: 0 },
        startTime: Date.now(),
        isActive: true
      };
      
      gameStates.set(socket.id, gameState);
      io.emit('gameStarted', {
        question: questions[0],
        scores: gameState.scores
      });
    } catch (error) {
      console.error('Error starting game:', error);
      socket.emit('error', 'Failed to start game');
    }
  });

  // Handle player answer
  socket.on('submitAnswer', async (data: { answer: string, playerId: string }) => {
    const gameState = gameStates.get(socket.id);
    if (!gameState || !gameState.isActive) return;

    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    const timeElapsed = Date.now() - gameState.startTime;
    const points = Math.max(0, Math.floor(1000 - (timeElapsed / 10)));

    if (data.answer === currentQuestion.correctAnswer) {
      gameState.scores[data.playerId] += points;
      
      // Move to next question or end game
      if (gameState.currentQuestionIndex < gameState.questions.length - 1) {
        gameState.currentQuestionIndex++;
        gameState.startTime = Date.now();
        io.emit('nextQuestion', {
          question: gameState.questions[gameState.currentQuestionIndex],
          scores: gameState.scores
        });
      } else {
        gameState.isActive = false;
        io.emit('gameOver', {
          scores: gameState.scores,
          winner: gameState.scores.player1 > gameState.scores.player2 ? 'player1' : 'player2'
        });
      }
    }
  });

  // Handle game reset
  socket.on('resetGame', () => {
    gameStates.delete(socket.id);
    io.emit('gameReset');
  });
}; 