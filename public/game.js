// Connect to Socket.IO server
const socket = io();

// DOM Elements
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startButton = document.getElementById('start-button');
const playAgainButton = document.getElementById('play-again-button');
const questionText = document.getElementById('question-text');
const pointsDisplay = document.getElementById('points');
const player1Score = document.getElementById('player1-score');
const player2Score = document.getElementById('player2-score');
const winnerText = document.getElementById('winner-text');
const finalPlayer1Score = document.getElementById('final-player1-score');
const finalPlayer2Score = document.getElementById('final-player2-score');
const arcadePlane = document.getElementById('arcade-plane');

// Audio elements
const correctSound = document.getElementById('correct-sound');
const incorrectSound = document.getElementById('incorrect-sound');
const winnerSound = document.getElementById('winner-sound');

// Feedback elements
const answerFeedback = document.getElementById('answer-feedback');
const feedbackPlayer = document.getElementById('feedback-player');
const feedbackPoints = document.getElementById('feedback-points');

// Countdown elements
const countdownOverlay = document.querySelector('.countdown-overlay');
const countdownNumber = document.getElementById('countdown-number');
const countdownStart = document.getElementById('countdown-start');

// Game state
let gameActive = false;
let timerInterval;
let lastKeyPressed = null;
let gameStartTime = 0;
let currentQuestion = null;
let canAnswer = true;
let lastAnswerTime = 0;
const LOCKOUT_DURATION = 1000; // 1 second lockout

// Arcade controller state
let gamepadConnected = false;
let lastButtonStates = {};
let autoStartTimer = null;

// Event Listeners
startButton.addEventListener('click', startGame);
playAgainButton.addEventListener('click', startGame);

// Gamepad event listeners
window.addEventListener("gamepadconnected", (e) => {
    console.log("Gamepad connected:", e.gamepad.id);
    gamepadConnected = true;
    updateControllerStatus();
    
    // Auto-start game after 3 seconds when controller is connected
    if (startScreen && !startScreen.classList.contains('hidden')) {
        autoStartTimer = setTimeout(() => {
            startGame();
        }, 3000);
    }
});

window.addEventListener("gamepaddisconnected", (e) => {
    console.log("Gamepad disconnected:", e.gamepad.id);
    gamepadConnected = false;
    updateControllerStatus();
    
    // Clear auto-start timer if controller disconnects
    if (autoStartTimer) {
        clearTimeout(autoStartTimer);
        autoStartTimer = null;
    }
});

function updateControllerStatus() {
    const statusElement = document.getElementById('controller-status');
    if (statusElement) {
        if (gamepadConnected) {
            if (autoStartTimer) {
                statusElement.textContent = 'ARCADE CONTROLLER CONNECTED - Auto-starting in 3 seconds or press GREEN button...';
            } else {
                statusElement.textContent = 'ARCADE CONTROLLER CONNECTED - Press GREEN button to start!';
            }
            statusElement.className = 'controller-status connected';
        } else {
            statusElement.textContent = 'ARCADE CONTROLLER NOT CONNECTED - Use keyboard controls';
            statusElement.className = 'controller-status disconnected';
        }
    }
}

// Gamepad polling function
function pollGamepad() {
    if (!gamepadConnected) return;
    
    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[0]; // Assume first gamepad is our arcade controller
    
    if (!gamepad) return;
    
    // Check each button (0-7 for our 8-button arcade controller)
    for (let i = 0; i < Math.min(8, gamepad.buttons.length); i++) {
        const button = gamepad.buttons[i];
        const wasPressed = lastButtonStates[i] || false;
        const isPressed = button.pressed;
        
        // Detect button press (not held)
        if (isPressed && !wasPressed) {
            handleControllerInput(i);
        }
        
        lastButtonStates[i] = isPressed;
    }
}

function handleControllerInput(buttonIndex) {
    // Handle green buttons (0 and 4) for start/restart game
    if (buttonIndex === 0 || buttonIndex === 4) { // Green buttons for both players
        if (!gameActive && !startScreen.classList.contains('hidden')) {
            // Cancel auto-start timer if manually triggered
            if (autoStartTimer) {
                clearTimeout(autoStartTimer);
                autoStartTimer = null;
            }
            // Start game from start screen
            startGame();
            return;
        } else if (!gameActive && !gameOverScreen.classList.contains('hidden')) {
            // Restart game from game over screen
            startGame();
            return;
        }
    }
    
    if (!gameActive || !currentQuestion || !canAnswer) {
        return;
    }
    
    const now = Date.now();
    if (now - lastAnswerTime < LOCKOUT_DURATION) return;
    
    let optionIndex;
    let playerId;
    
    // Map controller buttons to players and options
    // Player 1: buttons 0-3 (Green, Red, Yellow, Blue)
    // Player 2: buttons 4-7 (Green, Red, Yellow, Blue)
    switch (buttonIndex) {
        case 0: playerId = 'player1'; optionIndex = 0; break; // Green
        case 1: playerId = 'player1'; optionIndex = 2; break; // Red  
        case 2: playerId = 'player1'; optionIndex = 3; break; // Yellow
        case 3: playerId = 'player1'; optionIndex = 1; break; // Blue
        case 4: playerId = 'player2'; optionIndex = 0; break; // Green
        case 5: playerId = 'player2'; optionIndex = 2; break; // Red
        case 6: playerId = 'player2'; optionIndex = 3; break; // Yellow
        case 7: playerId = 'player2'; optionIndex = 1; break; // Blue
    }
    
    if (optionIndex !== undefined) {
        lastKeyPressed = playerId;
        lastAnswerTime = now;
        const options = document.getElementById('options');
        const option = options.children[optionIndex];
        if (option && !option.disabled) {
            option.click();
        }
    }
}

// Start gamepad polling
setInterval(pollGamepad, 16); // ~60fps polling

// Initialize controller status on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check for already connected gamepads
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
            gamepadConnected = true;
            updateControllerStatus();
            break;
        }
    }
    updateControllerStatus();
});

// Keyboard controls (kept for testing purposes)
document.addEventListener('keydown', (event) => {
    if (!gameActive || !currentQuestion || !canAnswer) return;
    
    const now = Date.now();
    if (now - lastAnswerTime < LOCKOUT_DURATION) return;
    
    const key = event.key.toLowerCase();
    let optionIndex;
    let playerId;
    
    // Player 1 controls (QWER)
    if (key === 'q') { playerId = 'player1'; optionIndex = 0; }
    else if (key === 'w') { playerId = 'player1'; optionIndex = 1; }
    else if (key === 'e') { playerId = 'player1'; optionIndex = 2; }
    else if (key === 'r') { playerId = 'player1'; optionIndex = 3; }
    
    // Player 2 controls (UIOP)
    else if (key === 'u') { playerId = 'player2'; optionIndex = 0; }
    else if (key === 'i') { playerId = 'player2'; optionIndex = 1; }
    else if (key === 'o') { playerId = 'player2'; optionIndex = 2; }
    else if (key === 'p') { playerId = 'player2'; optionIndex = 3; }
    
    if (optionIndex !== undefined) {
        lastKeyPressed = playerId;
        lastAnswerTime = now;
        const options = document.getElementById('options');
        const option = options.children[optionIndex];
        if (option && !option.disabled) {
            option.click();
        }
    }
});

// Socket.IO event handlers
socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    gameActive = false;
    clearInterval(timerInterval);
});

socket.on('gameStarted', ({ question, scores }) => {
    console.log('Game started:', question, scores);
    showGameScreen();
    updateQuestion(question);
    updateScores(scores);
    startCountdown();
    // Start timer for first question after countdown
});

socket.on('nextQuestion', ({ question, scores }) => {
    console.log('Next question:', question, scores);
    currentQuestion = question;
    updateQuestion(question);
    updateScores(scores);
    startTimer();
    enableAllButtons();
    canAnswer = true;
    lastAnswerTime = 0;
});

socket.on('gameOver', ({ scores, winner }) => {
    console.log('Game over:', scores, winner);
    gameActive = false;
    clearInterval(timerInterval);
    showGameOverScreen(scores, winner);
});

socket.on('error', (message) => {
    console.error('Server error:', message);
    alert(message);
});

// Game functions
function startGame() {
    console.log('Starting game...');
    socket.emit('startGame');
    gameActive = true;
    currentQuestion = null;
    canAnswer = true;
    lastAnswerTime = 0;
}

function showGameScreen() {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    if (arcadePlane) arcadePlane.style.display = 'none';
}

function showGameOverScreen(scores, winner) {
    gameScreen.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
    if (arcadePlane) arcadePlane.style.display = 'none';
    
    finalPlayer1Score.textContent = scores.player1;
    finalPlayer2Score.textContent = scores.player2;
    winnerText.textContent = `${winner === 'player1' ? 'PLAYER 1' : 'PLAYER 2'} WINS!`;
    
    // Play winner sound
    winnerSound.currentTime = 0;
    winnerSound.play().catch(e => console.log('Sound play failed:', e));
}

function showStartScreen() {
    startScreen.classList.remove('hidden');
    gameScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    if (arcadePlane) arcadePlane.style.display = '';
}

function updateQuestion(question) {
    currentQuestion = question;
    questionText.textContent = question.text;
    
    // Clear previous options
    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';
    
    // Create option buttons
    question.options.forEach((option, index) => {
        const button = createOptionButton(option, index);
        optionsContainer.appendChild(button);
    });
}

function createOptionButton(option, index) {
    const button = document.createElement('button');
    button.className = 'option-button';
    button.textContent = option;
    button.dataset.index = index;
    
    button.addEventListener('click', () => {
        if (gameActive && currentQuestion && canAnswer) {
            const playerId = lastKeyPressed === 'player1' ? 'player1' : 'player2';
            socket.emit('submitAnswer', { 
                answer: option, 
                playerId,
                questionId: currentQuestion.id 
            });
            disableAllButtons();
        }
    });
    return button;
}

function disableAllButtons() {
    const allButtons = document.querySelectorAll('.option-button');
    allButtons.forEach(button => {
        button.disabled = true;
        button.style.opacity = '0.5';
    });
}

function enableAllButtons() {
    const allButtons = document.querySelectorAll('.option-button');
    allButtons.forEach(button => {
        button.disabled = false;
        button.style.opacity = '1';
        button.classList.remove('correct', 'incorrect');
    });
}

function updateScores(scores) {
    player1Score.textContent = scores.player1;
    player2Score.textContent = scores.player2;
}

function startTimer() {
    clearInterval(timerInterval);
    let timeLeft = 10000;
    gameStartTime = Date.now();
    
    timerInterval = setInterval(() => {
        timeLeft = Math.max(0, timeLeft - 10);
        const points = Math.max(1, Math.floor(timeLeft / 10));
        pointsDisplay.textContent = points;
        
        if (timeLeft === 0) {
            pointsDisplay.textContent = '1';
            pointsDisplay.classList.add('time-up');
            enableAllButtons();
        }
    }, 10);
}

function showFeedback(playerId, points, isLateAnswer) {
    feedbackPlayer.textContent = playerId === 'player1' ? 'PLAYER 1' : 'PLAYER 2';
    feedbackPoints.textContent = points;
    if (isLateAnswer) {
        answerFeedback.classList.add('late-answer');
    } else {
        answerFeedback.classList.remove('late-answer');
    }
    answerFeedback.classList.remove('hidden');
    
    setTimeout(() => {
        answerFeedback.classList.add('hidden');
    }, 2000);
}

socket.on('answerFeedback', ({ playerId, isCorrect, correctAnswer, points, isLateAnswer }) => {
    const options = document.getElementById('options');
    const selectedButton = options.querySelector('.option-button:disabled');
    
    if (selectedButton) {
        if (isCorrect) {
            selectedButton.classList.add('correct');
            canAnswer = false;
            setTimeout(() => {
                correctSound.currentTime = 0;
                correctSound.play().catch(e => console.log('Sound play failed:', e));
            }, 100);
            showFeedback(playerId, points, isLateAnswer);
        } else {
            selectedButton.classList.add('incorrect');
            setTimeout(() => {
                incorrectSound.currentTime = 0;
                incorrectSound.play().catch(e => console.log('Sound play failed:', e));
            }, 100);
            // Re-enable buttons immediately for wrong answers
            enableAllButtons();
        }
    }
    
    if (isCorrect) {
        const allButtons = document.querySelectorAll('.option-button');
        allButtons.forEach(button => {
            if (button.textContent === correctAnswer) {
                button.classList.add('correct');
            }
        });
    }
});

function startCountdown() {
    let count = 3;
    countdownOverlay.classList.remove('hidden');
    countdownNumber.textContent = count;
    countdownStart.classList.add('hidden');
    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownNumber.textContent = count;
        } else if (count === 0) {
            countdownNumber.classList.add('hidden');
            countdownStart.classList.remove('hidden');
        } else {
            clearInterval(countdownInterval);
            countdownOverlay.classList.add('hidden');
            countdownNumber.classList.remove('hidden');
            countdownStart.classList.add('hidden');
            startTimer(); // Start timer for first question here
        }
    }, 1000);
} 