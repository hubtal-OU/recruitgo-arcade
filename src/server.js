const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Serve static files from the public directory
app.use(express.static('public'));

// Game state
const gameStates = new Map();

// Load questions from JSON file
async function loadQuestions() {
  const data = await fs.readFile(path.join(__dirname, 'questions.json'), 'utf8');
  const questions = JSON.parse(data).questions;
  // Add unique IDs to questions
  return questions.map((q, index) => ({ ...q, id: `q${index + 1}` }));
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Calculate points based on time elapsed
function calculatePoints(timeElapsed) {
  if (timeElapsed > 10000) return 1;
  return Math.max(1, Math.floor(1000 - (timeElapsed / 10)));
}

// Socket.IO connection handling
io.on('connection', async (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('startGame', async () => {
    try {
      const questions = await loadQuestions();
      const selectedQuestions = shuffleArray([...questions]).slice(0, 10);
      
      const gameState = {
        questions: selectedQuestions,
        currentQuestionIndex: 0,
        scores: { player1: 0, player2: 0 },
        startTime: Date.now(),
        isActive: true,
        lastAnswerTime: null,
        wrongAnswers: new Set(), // Track wrong answers for the current question
        timeLimit: 10000, // 10 seconds time limit
        lockedPlayers: new Set(), // Track players who are locked out
        answeredPlayers: new Set() // Track players who have answered the current question
      };
      
      gameStates.set(socket.id, gameState);
      
      // Send initial question and scores
      io.emit('gameStarted', {
        question: selectedQuestions[0],
        scores: gameState.scores
      });
    } catch (error) {
      console.error('Error starting game:', error);
      socket.emit('error', 'Failed to start game');
    }
  });

  socket.on('submitAnswer', ({ answer, playerId, questionId }) => {
    const gameState = gameStates.get(socket.id);
    if (!gameState || !gameState.isActive) return;

    // Check if player is locked out
    if (gameState.lockedPlayers.has(playerId)) {
      return;
    }

    // Check if player has already answered this question
    if (gameState.answeredPlayers.has(playerId)) {
      return;
    }

    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    
    // Verify question ID to prevent double answers
    if (currentQuestion.id !== questionId) {
      console.log('Question ID mismatch:', currentQuestion.id, questionId);
      return;
    }

    const isCorrect = answer === currentQuestion.correctAnswer;
    const timeElapsed = Date.now() - gameState.startTime;
    const points = calculatePoints(timeElapsed);
    
    // Mark player as having answered
    gameState.answeredPlayers.add(playerId);
    
    // Update scores
    if (isCorrect) {
      gameState.scores[playerId] += points;
      gameState.lastAnswerTime = Date.now();
      gameState.wrongAnswers.clear(); // Clear wrong answers when someone gets it right
      gameState.lockedPlayers.clear(); // Clear locked players when someone gets it right
    } else {
      // Track wrong answer and lock player for 1 second
      gameState.wrongAnswers.add(playerId);
      gameState.lockedPlayers.add(playerId);
      setTimeout(() => {
        gameState.lockedPlayers.delete(playerId);
      }, 1000);
    }
    
    // Send feedback to all clients
    io.emit('answerFeedback', {
      playerId,
      isCorrect,
      correctAnswer: currentQuestion.correctAnswer,
      points: isCorrect ? points : 0,
      isLateAnswer: timeElapsed > gameState.timeLimit
    });
    
    // Wait a moment to show the feedback before moving to next question
    setTimeout(() => {
      if (isCorrect) {
        if (gameState.currentQuestionIndex < gameState.questions.length - 1) {
          gameState.currentQuestionIndex++;
          gameState.startTime = Date.now();
          gameState.wrongAnswers.clear(); // Clear wrong answers for new question
          gameState.lockedPlayers.clear(); // Clear locked players for new question
          gameState.answeredPlayers.clear(); // Clear answered players for new question
          io.emit('nextQuestion', {
            question: gameState.questions[gameState.currentQuestionIndex],
            scores: gameState.scores
          });
        } else {
          gameState.isActive = false;
          const winner = gameState.scores.player1 > gameState.scores.player2 ? 'player1' : 'player2';
          io.emit('gameOver', { scores: gameState.scores, winner });
        }
      } else {
        // If both players have answered incorrectly, move to next question after time limit
        if (gameState.wrongAnswers.size === 2) {
          const timeLeft = Math.max(0, gameState.timeLimit - timeElapsed);
          if (timeLeft <= 0) {
            if (gameState.currentQuestionIndex < gameState.questions.length - 1) {
              gameState.currentQuestionIndex++;
              gameState.startTime = Date.now();
              gameState.wrongAnswers.clear();
              gameState.lockedPlayers.clear();
              gameState.answeredPlayers.clear();
              io.emit('nextQuestion', {
                question: gameState.questions[gameState.currentQuestionIndex],
                scores: gameState.scores
              });
            } else {
              gameState.isActive = false;
              const winner = gameState.scores.player1 > gameState.scores.player2 ? 'player1' : 'player2';
              io.emit('gameOver', { scores: gameState.scores, winner });
            }
          }
        }
        // Re-enable buttons immediately for both players
        io.emit('enableButtons');
      }
    }, isCorrect ? 2000 : 1000);
  });

  socket.on('resetGame', () => {
    gameStates.delete(socket.id);
    io.emit('gameReset');
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    gameStates.delete(socket.id);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 