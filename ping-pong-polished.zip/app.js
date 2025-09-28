// Enhanced Game Configuration with Balanced AI Settings
const CONFIG = {
    canvas: { width: 800, height: 400 },
    paddle: { 
        width: 12, 
        height: 80, 
        speed: 600, // Increased player paddle speed
        margin: 15
    },
    ball: { 
        size: 12, 
        initialSpeed: 350, // Reduced initial speed
        maxSpeed: 650, // Reduced max speed
        speedIncrease: 15, // Reduced speed increase
        margin: 8
    },
    game: { winningScore: 5, fpsTarget: 60 },
    colors: {
        background: '#0a0a0f',
        paddle: '#00ff88',
        paddleGlow: '#44ffaa',
        ball: '#ff4444',
        ballGlow: '#ff6666',
        ui: '#ffffff',
        accent: '#00d4ff',
        secondary: '#8a2be2',
        trail: '#ff4444'
    },
    ai: {
        easy: { 
            speedMultiplier: 0.3, // Much slower
            reactionTime: 0.3, // Slower reactions
            accuracy: 0.3, // Lower accuracy
            errorRange: 80, // More error
            centeringSpeed: 0.15, // Slower centering
            missChance: 0.4 // Higher miss chance
        },
        medium: { 
            speedMultiplier: 0.5, 
            reactionTime: 0.15, 
            accuracy: 0.6, 
            errorRange: 40,
            centeringSpeed: 0.25,
            missChance: 0.2
        },
        hard: { 
            speedMultiplier: 0.7, 
            reactionTime: 0.08, 
            accuracy: 0.8, 
            errorRange: 20,
            centeringSpeed: 0.4,
            missChance: 0.1
        },
        expert: {
            speedMultiplier: 0.85,
            reactionTime: 0.05,
            accuracy: 0.9,
            errorRange: 10,
            centeringSpeed: 0.6,
            missChance: 0.05
        }
    }
};

// Enhanced Game State Management with Smooth Transitions
class GameState {
    constructor() {
        this.current = 'menu';
        this.previous = null;
        this.transitioning = false;
        this.screens = {
            menu: document.getElementById('mainMenu'),
            game: document.getElementById('gameScreen'),
            settings: document.getElementById('settingsScreen'),
            gameOver: document.getElementById('gameOverScreen'),
            pause: document.getElementById('pauseScreen'),
            instructions: document.getElementById('instructionsOverlay')
        };
    }

    async switchTo(newState) {
        if (this.transitioning) return;
        
        this.transitioning = true;
        this.previous = this.current;
        
        // Fade out current screen
        if (this.screens[this.current]) {
            this.screens[this.current].style.opacity = '0';
            await new Promise(resolve => setTimeout(resolve, 200));
            this.screens[this.current].classList.add('hidden');
        }
        
        this.current = newState;
        
        // Fade in new screen
        if (this.screens[this.current]) {
            this.screens[this.current].classList.remove('hidden');
            this.screens[this.current].style.opacity = '0';
            await new Promise(resolve => setTimeout(resolve, 50));
            this.screens[this.current].style.opacity = '1';
        }
        
        this.transitioning = false;
    }
}

// Enhanced Ball with Better Physics
class Ball {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.speed = CONFIG.ball.initialSpeed;
        this.size = CONFIG.ball.size;
        this.trail = [];
        this.maxTrailLength = 20;
        this.color = CONFIG.colors.ball;
        this.glowIntensity = 0;
        this.particles = [];
    }

    reset(direction = 1) {
        this.x = CONFIG.canvas.width / 2;
        this.y = CONFIG.canvas.height / 2;
        this.speed = CONFIG.ball.initialSpeed;
        
        // Better angle calculation - more horizontal, less extreme
        const minAngle = Math.PI / 8; // 22.5 degrees
        const maxAngle = Math.PI / 4; // 45 degrees
        const angle = (Math.random() * (maxAngle - minAngle) + minAngle) * (Math.random() > 0.5 ? 1 : -1);
        
        this.vx = Math.cos(angle) * this.speed * direction;
        this.vy = Math.sin(angle) * this.speed;
        
        this.trail = [];
        this.particles = [];
        this.glowIntensity = 0;
    }

    update(deltaTime) {
        // Store previous position for trail
        this.trail.push({ x: this.x, y: this.y, alpha: 1 });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        // Update trail alpha with smooth falloff
        this.trail.forEach((point, index) => {
            point.alpha = Math.pow(index / this.trail.length, 2);
        });

        // Move ball with improved physics
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // Enhanced wall collision with better edge handling
        const topEdge = CONFIG.ball.margin;
        const bottomEdge = CONFIG.canvas.height - CONFIG.ball.margin;
        
        if (this.y <= topEdge) {
            this.y = topEdge;
            this.vy = Math.abs(this.vy); // Ensure ball bounces down
            this.createImpactEffect(this.x, topEdge);
            if (window.audioManager) window.audioManager.playSound('wall');
        } else if (this.y >= bottomEdge) {
            this.y = bottomEdge;
            this.vy = -Math.abs(this.vy); // Ensure ball bounces up
            this.createImpactEffect(this.x, bottomEdge);
            if (window.audioManager) window.audioManager.playSound('wall');
        }

        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime;
            particle.alpha = particle.life / particle.maxLife;
            return particle.life > 0;
        });

        // Update glow intensity based on speed
        this.glowIntensity = Math.min(1, (this.speed - CONFIG.ball.initialSpeed) / (CONFIG.ball.maxSpeed - CONFIG.ball.initialSpeed));
    }

    createImpactEffect(x, y) {
        // Create particle explosion
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                life: 0.5,
                maxLife: 0.5,
                alpha: 1,
                size: Math.random() * 3 + 1
            });
        }

        // Screen shake effect
        if (window.game) {
            window.game.addScreenShake(5);
        }
    }

    increaseSpeed() {
        if (this.speed < CONFIG.ball.maxSpeed) {
            this.speed += CONFIG.ball.speedIncrease;
            // Normalize velocity to maintain new speed
            const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (currentSpeed > 0) {
                this.vx = (this.vx / currentSpeed) * this.speed;
                this.vy = (this.vy / currentSpeed) * this.speed;
            }
        }
    }

    render(ctx, trailEnabled = true) {
        // Render particles
        this.particles.forEach(particle => {
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Render trail with improved gradient
        if (trailEnabled && this.trail.length > 1) {
            for (let i = 1; i < this.trail.length; i++) {
                const current = this.trail[i];
                const previous = this.trail[i - 1];
                
                ctx.globalAlpha = current.alpha * 0.7;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = Math.max(1, current.alpha * 4);
                ctx.beginPath();
                ctx.moveTo(previous.x, previous.y);
                ctx.lineTo(current.x, current.y);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }

        // Enhanced ball rendering with dynamic glow
        const glowRadius = this.size/2 + (this.glowIntensity * 15);
        
        // Outer glow
        const outerGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowRadius);
        outerGradient.addColorStop(0, this.color + 'CC');
        outerGradient.addColorStop(0.7, this.color + '44');
        outerGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = outerGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Inner glow
        const innerGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size/2);
        innerGradient.addColorStop(0, '#ffffff');
        innerGradient.addColorStop(0.6, this.color);
        innerGradient.addColorStop(1, this.color + 'AA');
        
        ctx.fillStyle = innerGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size/2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Enhanced Paddle with Better Physics and Rendering
class Paddle {
    constructor(x, y, isPlayer = false) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.paddle.width;
        this.height = CONFIG.paddle.height;
        this.speed = CONFIG.paddle.speed;
        this.vy = 0;
        this.isPlayer = isPlayer;
        this.color = CONFIG.colors.paddle;
        this.targetY = y;
        this.smoothing = 0.1;
    }

    update(deltaTime) {
        // Smooth movement interpolation for AI
        if (!this.isPlayer) {
            const diff = this.targetY - this.y;
            this.y += diff * this.smoothing;
        } else {
            // Direct movement for player with better responsiveness
            this.y += this.vy * deltaTime;
        }
        
        // Enhanced boundary clamping with safety margins
        const minY = CONFIG.paddle.margin + this.height/2;
        const maxY = CONFIG.canvas.height - CONFIG.paddle.margin - this.height/2;
        
        this.y = Math.max(minY, Math.min(maxY, this.y));
        
        // Apply friction for smoother movement
        if (this.isPlayer) {
            this.vy *= 0.9; // Reduced friction for more responsive control
        }
    }

    moveUp() {
        this.vy = -this.speed;
    }

    moveDown() {
        this.vy = this.speed;
    }

    stop() {
        this.vy = 0;
    }

    getBounds() {
        return {
            left: this.x - this.width/2,
            right: this.x + this.width/2,
            top: this.y - this.height/2,
            bottom: this.y + this.height/2
        };
    }

    render(ctx) {
        // Enhanced paddle rendering with gradient and glow
        const gradient = ctx.createLinearGradient(
            this.x - this.width/2, 0, 
            this.x + this.width/2, 0
        );
        gradient.addColorStop(0, CONFIG.colors.paddleGlow);
        gradient.addColorStop(0.5, this.color);
        gradient.addColorStop(1, CONFIG.colors.paddleGlow);
        
        // Glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Main paddle with rounded edges
        ctx.fillStyle = gradient;
        ctx.beginPath();
        
        // Create rounded rectangle manually
        const x = this.x - this.width/2;
        const y = this.y - this.height/2;
        const radius = this.width/2;
        
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + this.width - radius, y);
        ctx.quadraticCurveTo(x + this.width, y, x + this.width, y + radius);
        ctx.lineTo(x + this.width, y + this.height - radius);
        ctx.quadraticCurveTo(x + this.width, y + this.height, x + this.width - radius, y + this.height);
        ctx.lineTo(x + radius, y + this.height);
        ctx.quadraticCurveTo(x, y + this.height, x, y + this.height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
        
        // Inner highlight
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(
            this.x - this.width/4,
            this.y - this.height/2 + 2,
            this.width/2,
            this.height - 4
        );
    }
}

// Enhanced AI with Much Better Balance
class AIPlayer {
    constructor(paddle, difficulty = 'easy') {
        this.paddle = paddle;
        this.setDifficulty(difficulty);
        this.lastDecisionTime = 0;
        this.lastPosition = paddle.y;
        this.reactionBuffer = [];
        this.maxBufferSize = 10;
        this.shouldMiss = false;
        this.missTarget = 0;
    }

    setDifficulty(difficulty) {
        this.difficulty = CONFIG.ai[difficulty] || CONFIG.ai.easy;
        this.paddle.smoothing = this.difficulty.centeringSpeed;
    }

    update(deltaTime, ball) {
        const currentTime = Date.now() / 1000;
        
        // Add current ball position to reaction buffer
        this.reactionBuffer.push({
            x: ball.x,
            y: ball.y,
            vx: ball.vx,
            vy: ball.vy,
            time: currentTime
        });
        
        if (this.reactionBuffer.length > this.maxBufferSize) {
            this.reactionBuffer.shift();
        }

        // Only react when ball is coming towards AI and within a certain range
        const ballComingToAI = ball.vx > 0 && ball.x > CONFIG.canvas.width * 0.4;
        
        if (ballComingToAI && currentTime - this.lastDecisionTime > this.difficulty.reactionTime) {
            this.makeDecision(ball);
            this.lastDecisionTime = currentTime;
        } else if (!ballComingToAI) {
            // Return to center when ball is not coming
            this.returnToCenter();
        }

        this.paddle.update(deltaTime);
    }

    makeDecision(ball) {
        // Random chance to miss completely
        this.shouldMiss = Math.random() < this.difficulty.missChance;
        
        if (this.shouldMiss) {
            // Deliberately aim away from the ball
            const missDirection = Math.random() > 0.5 ? 1 : -1;
            this.missTarget = ball.y + (missDirection * (100 + Math.random() * 150));
            this.paddle.targetY = Math.max(
                CONFIG.paddle.margin + this.paddle.height/2,
                Math.min(CONFIG.canvas.height - CONFIG.paddle.margin - this.paddle.height/2, this.missTarget)
            );
            return;
        }

        let targetY = ball.y;
        
        // Simple prediction for higher difficulties
        if (this.difficulty.accuracy > 0.6) {
            targetY = this.predictBallPosition(ball);
        }
        
        // Add significant inaccuracy
        const error = (Math.random() - 0.5) * this.difficulty.errorRange;
        targetY += error;
        
        // Ensure target is within safe bounds
        const minTarget = CONFIG.paddle.margin + this.paddle.height/2 + 20;
        const maxTarget = CONFIG.canvas.height - CONFIG.paddle.margin - this.paddle.height/2 - 20;
        
        targetY = Math.max(minTarget, Math.min(maxTarget, targetY));
        
        // Limit movement speed based on difficulty
        const maxChange = 150 * this.difficulty.speedMultiplier;
        targetY = Math.max(
            this.paddle.targetY - maxChange,
            Math.min(this.paddle.targetY + maxChange, targetY)
        );
        
        this.paddle.targetY = targetY;
    }

    predictBallPosition(ball) {
        // Simple prediction - only predict one bounce
        const timeToReach = Math.max(0.2, (this.paddle.x - ball.x) / Math.abs(ball.vx));
        let predictedY = ball.y + (ball.vy * timeToReach);
        
        // Simple wall bounce prediction
        const topWall = CONFIG.ball.margin;
        const bottomWall = CONFIG.canvas.height - CONFIG.ball.margin;
        
        if (predictedY < topWall) {
            predictedY = topWall + (topWall - predictedY);
        } else if (predictedY > bottomWall) {
            predictedY = bottomWall - (predictedY - bottomWall);
        }
        
        return Math.max(topWall, Math.min(bottomWall, predictedY));
    }

    returnToCenter() {
        const centerY = CONFIG.canvas.height / 2;
        const diff = centerY - this.paddle.y;
        
        if (Math.abs(diff) > 30) {
            this.paddle.targetY = this.paddle.y + (diff * 0.05); // Very slow return to center
        }
    }
}

// Enhanced Audio Manager
class AudioManager {
    constructor() {
        this.sounds = {};
        this.volume = 0.7;
        this.enabled = true;
        this.audioContext = null;
        this.initAudioContext();
    }

    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.createSounds();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    createSounds() {
        this.sounds.paddle = this.createComplexTone([800, 1200], 0.1, 'sawtooth');
        this.sounds.wall = this.createComplexTone([400, 600], 0.15, 'triangle');
        this.sounds.score = this.createComplexTone([600, 800, 1000], 0.4, 'sine');
    }

    createComplexTone(frequencies, duration, waveType = 'sine') {
        return () => {
            if (!this.audioContext || !this.enabled) return;
            
            const gainNode = this.audioContext.createGain();
            gainNode.connect(this.audioContext.destination);
            
            frequencies.forEach((freq, index) => {
                const oscillator = this.audioContext.createOscillator();
                const oscGain = this.audioContext.createGain();
                
                oscillator.connect(oscGain);
                oscGain.connect(gainNode);
                
                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                oscillator.type = waveType;
                
                const volume = this.volume * 0.1 / frequencies.length;
                oscGain.gain.setValueAtTime(0, this.audioContext.currentTime);
                oscGain.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
                oscGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + duration);
            });
        };
    }

    playSound(type) {
        if (this.sounds[type]) {
            this.sounds[type]();
        }
    }

    setVolume(volume) {
        this.volume = volume / 100;
    }
}

// Enhanced Main Game Class
class PingPongGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = new GameState();
        
        // Game objects with better positioning
        this.playerPaddle = new Paddle(CONFIG.paddle.margin + CONFIG.paddle.width/2, CONFIG.canvas.height / 2, true);
        this.aiPaddle = new Paddle(CONFIG.canvas.width - CONFIG.paddle.margin - CONFIG.paddle.width/2, CONFIG.canvas.height / 2);
        this.ai = new AIPlayer(this.aiPaddle, 'easy'); // Start with easy difficulty
        this.ball = new Ball(CONFIG.canvas.width / 2, CONFIG.canvas.height / 2);
        
        // Game state
        this.playerScore = 0;
        this.aiScore = 0;
        this.gameTime = 0;
        this.maxSpeed = CONFIG.ball.initialSpeed;
        this.isPaused = false;
        this.trailEnabled = true;
        this.gameStarted = false;
        
        // Enhanced visual effects
        this.screenShake = 0;
        this.backgroundParticles = [];
        
        // Input handling
        this.keys = {};
        this.lastTime = 0;
        
        // Settings
        this.difficulty = 'easy'; // Default to easy
        
        this.init();
    }

    init() {
        // Hide loading screen first
        this.hideLoadingScreen();
        
        this.setupEventListeners();
        this.setupUI();
        this.createBackgroundParticles();
        window.audioManager = new AudioManager();
        window.game = this;
        this.gameLoop();
    }

    hideLoadingScreen() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
            }, 1000);
        }
    }

    createBackgroundParticles() {
        for (let i = 0; i < 50; i++) {
            this.backgroundParticles.push({
                x: Math.random() * CONFIG.canvas.width,
                y: Math.random() * CONFIG.canvas.height,
                vx: (Math.random() - 0.5) * 20,
                vy: (Math.random() - 0.5) * 20,
                size: Math.random() * 2 + 1,
                alpha: Math.random() * 0.3 + 0.1
            });
        }
    }

    addScreenShake(intensity) {
        this.screenShake = Math.max(this.screenShake, intensity);
    }

    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Menu buttons
        document.getElementById('startGameBtn').addEventListener('click', () => this.showInstructions());
        document.getElementById('settingsBtn').addEventListener('click', () => this.gameState.switchTo('settings'));
        document.getElementById('startPlayingBtn').addEventListener('click', () => this.startGame());
        
        // Settings
        document.getElementById('backToMenuBtn').addEventListener('click', () => this.backToMenu());
        document.getElementById('difficultySelect').addEventListener('change', (e) => this.changeDifficulty(e.target.value));
        document.getElementById('volumeSlider').addEventListener('input', (e) => this.changeVolume(e.target.value));
        document.getElementById('trailEffectCheckbox').addEventListener('change', (e) => this.trailEnabled = e.target.checked);
        
        // Game over buttons
        document.getElementById('playAgainBtn').addEventListener('click', () => this.startGame());
        document.getElementById('mainMenuBtn').addEventListener('click', () => this.backToMenu());
        
        // Pause buttons
        document.getElementById('resumeBtn').addEventListener('click', () => this.resumeGame());
        document.getElementById('pauseMenuBtn').addEventListener('click', () => this.backToMenu());
    }

    setupUI() {
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeValue = document.getElementById('volumeValue');
        
        volumeSlider.addEventListener('input', (e) => {
            volumeValue.textContent = e.target.value + '%';
            if (window.audioManager) {
                window.audioManager.setVolume(e.target.value);
            }
        });
        
        volumeValue.textContent = volumeSlider.value + '%';
        
        // Set default difficulty to easy
        document.getElementById('difficultySelect').value = 'easy';
        this.changeDifficulty('easy');
        
        this.updateDifficultyDisplay();
    }

    updateDifficultyDisplay() {
        const difficultyEl = document.getElementById('currentDifficulty');
        if (difficultyEl) {
            difficultyEl.textContent = this.difficulty.toUpperCase();
        }
    }

    showInstructions() {
        this.gameState.switchTo('instructions');
    }

    startGame() {
        this.resetGame();
        this.gameState.switchTo('game');
        this.gameStarted = true;
        this.isPaused = false;
        this.ball.reset(Math.random() > 0.5 ? 1 : -1);
    }

    backToMenu() {
        this.gameStarted = false;
        this.isPaused = false;
        this.resetGame();
        this.gameState.switchTo('menu');
    }

    resetGame() {
        this.playerScore = 0;
        this.aiScore = 0;
        this.gameTime = 0;
        this.maxSpeed = CONFIG.ball.initialSpeed;
        this.screenShake = 0;
        
        // Reset paddle positions
        this.playerPaddle.y = CONFIG.canvas.height / 2;
        this.playerPaddle.vy = 0;
        this.playerPaddle.targetY = CONFIG.canvas.height / 2;
        
        this.aiPaddle.y = CONFIG.canvas.height / 2;
        this.aiPaddle.vy = 0;
        this.aiPaddle.targetY = CONFIG.canvas.height / 2;
        
        this.updateScoreDisplay();
        this.ball.speed = CONFIG.ball.initialSpeed;
    }

    pauseGame() {
        if (this.gameState.current === 'game' && this.gameStarted) {
            this.isPaused = true;
            this.gameState.switchTo('pause');
        }
    }

    resumeGame() {
        if (this.gameState.current === 'pause') {
            this.isPaused = false;
            this.gameState.switchTo('game');
        }
    }

    changeDifficulty(difficulty) {
        this.difficulty = difficulty;
        this.ai.setDifficulty(difficulty);
        this.updateDifficultyDisplay();
    }

    changeVolume(volume) {
        if (window.audioManager) {
            window.audioManager.setVolume(volume);
        }
    }

    handleKeyDown(e) {
        if (['KeyW', 'KeyS', 'Escape', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
            e.preventDefault();
        }
        
        this.keys[e.code] = true;
        
        if (e.code === 'Escape') {
            if (this.gameState.current === 'game' && this.gameStarted && !this.isPaused) {
                this.pauseGame();
            } else if (this.gameState.current === 'pause') {
                this.resumeGame();
            }
        }
    }

    handleKeyUp(e) {
        if (['KeyW', 'KeyS', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
            e.preventDefault();
        }
        this.keys[e.code] = false;
    }

    updateInput(deltaTime) {
        if (this.gameState.current !== 'game' || this.isPaused || !this.gameStarted) return;
        
        // Enhanced player paddle movement
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            this.playerPaddle.moveUp();
        } else if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            this.playerPaddle.moveDown();
        } else {
            this.playerPaddle.stop();
        }
    }

    checkCollisions() {
        const ballBounds = {
            left: this.ball.x - this.ball.size/2,
            right: this.ball.x + this.ball.size/2,
            top: this.ball.y - this.ball.size/2,
            bottom: this.ball.y + this.ball.size/2
        };

        const tolerance = 3;

        // Player paddle collision
        const playerBounds = this.playerPaddle.getBounds();
        if (ballBounds.right >= playerBounds.left - tolerance && 
            ballBounds.left <= playerBounds.right + tolerance &&
            ballBounds.bottom >= playerBounds.top - tolerance &&
            ballBounds.top <= playerBounds.bottom + tolerance &&
            this.ball.vx < 0) {
            
            this.handlePaddleHit(this.playerPaddle);
        }

        // AI paddle collision
        const aiBounds = this.aiPaddle.getBounds();
        if (ballBounds.right >= aiBounds.left - tolerance && 
            ballBounds.left <= aiBounds.right + tolerance &&
            ballBounds.bottom >= aiBounds.top - tolerance &&
            ballBounds.top <= aiBounds.bottom + tolerance &&
            this.ball.vx > 0) {
            
            this.handlePaddleHit(this.aiPaddle);
        }

        // Score detection
        if (this.ball.x < -CONFIG.ball.margin) {
            this.aiScore++;
            this.handleScore();
        } else if (this.ball.x > CONFIG.canvas.width + CONFIG.ball.margin) {
            this.playerScore++;
            this.handleScore();
        }
    }

    handlePaddleHit(paddle) {
        // Calculate hit position relative to paddle center
        const relativeIntersectY = (this.ball.y - paddle.y) / (paddle.height / 2);
        
        // Calculate new velocity with improved physics
        const maxBounceAngle = Math.PI / 4; // 45 degrees max
        const bounceAngle = relativeIntersectY * maxBounceAngle;
        
        // Set new velocity direction
        const direction = paddle === this.playerPaddle ? 1 : -1;
        this.ball.vx = Math.cos(bounceAngle) * this.ball.speed * direction;
        this.ball.vy = Math.sin(bounceAngle) * this.ball.speed;
        
        // Move ball away from paddle to prevent double collision
        const separation = paddle.width/2 + this.ball.size/2 + 3;
        if (paddle === this.playerPaddle) {
            this.ball.x = paddle.x + separation;
        } else {
            this.ball.x = paddle.x - separation;
        }
        
        // Increase ball speed more gradually
        this.ball.increaseSpeed();
        this.maxSpeed = Math.max(this.maxSpeed, this.ball.speed);
        
        this.updateSpeedProgress();
        
        // Effects
        if (window.audioManager) window.audioManager.playSound('paddle');
        this.ball.createImpactEffect(this.ball.x, this.ball.y);
        this.addScreenShake(3);
    }

    updateSpeedProgress() {
        const speedProgress = document.getElementById('speedProgress');
        if (speedProgress) {
            const progress = ((this.ball.speed - CONFIG.ball.initialSpeed) / (CONFIG.ball.maxSpeed - CONFIG.ball.initialSpeed)) * 100;
            speedProgress.style.width = Math.min(100, Math.max(0, progress)) + '%';
        }
    }

    handleScore() {
        if (window.audioManager) window.audioManager.playSound('score');
        this.updateScoreDisplay();
        
        if (this.playerScore >= CONFIG.game.winningScore || this.aiScore >= CONFIG.game.winningScore) {
            this.endGame();
        } else {
            setTimeout(() => {
                if (this.gameState.current === 'game' && this.gameStarted) {
                    this.ball.reset(this.playerScore > this.aiScore ? -1 : 1);
                }
            }, 1500);
        }
    }

    endGame() {
        this.gameStarted = false;
        const playerWon = this.playerScore >= CONFIG.game.winningScore;
        
        const winnerText = document.getElementById('winnerText');
        winnerText.textContent = playerWon ? 'Player Wins!' : 'AI Wins!';
        winnerText.className = playerWon ? 'winner-text player-win' : 'winner-text ai-win';
        
        document.getElementById('finalPlayerScore').textContent = this.playerScore;
        document.getElementById('finalAiScore').textContent = this.aiScore;
        document.getElementById('finalGameTime').textContent = this.formatTime(this.gameTime);
        document.getElementById('maxSpeedReached').textContent = Math.round(this.maxSpeed);
        
        this.gameState.switchTo('gameOver');
    }

    updateScoreDisplay() {
        const playerScoreEl = document.getElementById('playerScore');
        const aiScoreEl = document.getElementById('aiScore');
        
        playerScoreEl.textContent = this.playerScore;
        aiScoreEl.textContent = this.aiScore;
        
        // Add pulse animation
        playerScoreEl.style.transform = 'scale(1.2)';
        aiScoreEl.style.transform = 'scale(1.2)';
        
        setTimeout(() => {
            playerScoreEl.style.transform = 'scale(1)';
            aiScoreEl.style.transform = 'scale(1)';
        }, 200);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    update(deltaTime) {
        if (this.gameState.current !== 'game' || this.isPaused || !this.gameStarted) return;
        
        this.gameTime += deltaTime;
        
        // Update UI
        document.getElementById('gameTimer').textContent = this.formatTime(this.gameTime);
        document.getElementById('speedValue').textContent = Math.round(this.ball.speed);
        
        // Update game objects
        this.updateInput(deltaTime);
        this.playerPaddle.update(deltaTime);
        this.ai.update(deltaTime, this.ball);
        this.ball.update(deltaTime);
        this.checkCollisions();
        
        // Update screen shake
        if (this.screenShake > 0) {
            this.screenShake *= 0.9;
            if (this.screenShake < 0.1) this.screenShake = 0;
        }
        
        // Update background particles
        this.backgroundParticles.forEach(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            
            if (particle.x < 0 || particle.x > CONFIG.canvas.width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > CONFIG.canvas.height) particle.vy *= -1;
        });
    }

    render() {
        // Apply screen shake
        this.ctx.save();
        if (this.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake;
            const shakeY = (Math.random() - 0.5) * this.screenShake;
            this.ctx.translate(shakeX, shakeY);
        }
        
        // Clear canvas with gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
        gradient.addColorStop(0, '#0a0a0f');
        gradient.addColorStop(0.5, '#0f0f1a');
        gradient.addColorStop(1, '#0a0a0f');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
        
        // Render background particles
        this.backgroundParticles.forEach(particle => {
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = CONFIG.colors.accent;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
        
        // Enhanced center line
        this.ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([15, 15]);
        this.ctx.beginPath();
        this.ctx.moveTo(CONFIG.canvas.width / 2, 0);
        this.ctx.lineTo(CONFIG.canvas.width / 2, CONFIG.canvas.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Render game objects
        if (this.gameState.current === 'game' || this.gameState.current === 'pause') {
            this.playerPaddle.render(this.ctx);
            this.aiPaddle.render(this.ctx);
            this.ball.render(this.ctx, this.trailEnabled);
        }
        
        this.ctx.restore();
    }

    gameLoop(currentTime = 0) {
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 1/30);
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new PingPongGame();
});