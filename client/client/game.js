// Game state and configuration
const gameConfig = {
    canvas: null,
    ctx: null,
    width: 800,
    height: 600,
    running: false,

    // Character stats
    jithin: {
        x: 150,
        y: 350,
        width: 150,
        height: 200,
        health: 100,
        maxHealth: 100,
        facing: 1, // 1 = right, -1 = left
        isAttacking: false,
        attackCooldown: 0,
        comboCount: 0,
        shaajiMode: false,
        shieldHits: 0,
        isMoving: false,
        animFrame: 0,
    },

    renjith: {
        x: 520,
        y: 350,
        width: 150,
        height: 200,
        health: 120,
        maxHealth: 100,
        facing: -1,
        isAttacking: false,
        attackCooldown: 0,
        lastSpecialAttack: 0,
        isMoving: false,
        animFrame: 0,
    },

    // Lifelines
    lifelines: {
        massBunk: 1, // Changed to 1 use as requested
        canteenStrike: 1,
    },

    // Input state
    keys: {},
    joystick: { active: false, x: 0, y: 0 },

    // Game timing
    lastTime: 0,
    animationSpeed: 200,
};

// Asset manager
const assets = {
    images: {},
    sounds: {},
    loaded: false,

    loadImage(name, src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.images[name] = img;
                resolve();
            };
            img.onerror = () => {
                // Create a placeholder colored rectangle if image fails to load
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                canvas.width = 64;
                canvas.height = 64;

                // Different colors for different assets
                const colors = {
                    jithin_head: "#FFE4C4",
                    jithin_body: "#4169E1",
                    renjith_head: "#FFE4C4",
                    renjith_body: "#228B22",
                    heart: "#FF0000",
                    shield: "#00FFFF",
                    sword: "#C0C0C0",
                    lifeline: "#FFD700",
                    mass_bunk: "#FF6347",
                    canteen_strike: "#8B4513",
                };

                ctx.fillStyle = colors[name] || "#CCCCCC";
                ctx.fillRect(0, 0, 64, 64);

                this.images[name] = canvas;
                resolve();
            };
            img.src = src;
        });
    },

    async loadAll() {
        const imagePromises = [
            // New pixel art background
            this.loadImage("background", "assets/background.png"),
            // New character sprites
            this.loadImage("jithin_idle", "assets/jithin_idle.png"),
            this.loadImage("jithin_attack", "assets/jithin_attack.png"),
            this.loadImage("jithin_shield", "assets/jithin_shield.png"),
            this.loadImage("renjith_idle", "assets/renjith_idle.png"),
            this.loadImage("renjith_attack", "assets/renjith_attack.png"),
            // UI elements
            this.loadImage("heart", "assets/heart.png"),
            this.loadImage("shield", "assets/shield.png"),
            this.loadImage("sword", "assets/sword.png"),
            this.loadImage("lifeline", "assets/lifeline.png"),
            this.loadImage("mass_bunk", "assets/mass_bunk.png"),
            this.loadImage("canteen_strike", "assets/canteen_strike.png"),
        ];

        await Promise.all(imagePromises);
        this.loaded = true;
        console.log("All assets loaded successfully");
    },
};

// Sound effects
const sound = {
    context: null,
    bgMusic: null,

    init() {
        try {
            this.context = new (window.AudioContext ||
                window.webkitAudioContext)();
            this.loadBackgroundMusic();
        } catch (e) {
            console.log("Web Audio API not supported");
        }
    },

    loadBackgroundMusic() {
        this.bgMusic = new Audio("assets/bg_song.mp3");
        this.bgMusic.loop = true;
        this.bgMusic.volume = 0.3; // 70% volume
        this.bgMusic.preload = "auto";
    },

    playBackgroundMusic() {
        if (this.bgMusic) {
            this.bgMusic.play().catch(() => {
                console.log(
                    "Background music failed to play - user interaction required",
                );
            });
        }
    },

    stopBackgroundMusic() {
        if (this.bgMusic) {
            this.bgMusic.pause();
            this.bgMusic.currentTime = 0;
        }
    },

    playTone(frequency, duration, type = "sine") {
        if (!this.context) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0.3, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            this.context.currentTime + duration,
        );

        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + duration);
    },

    punch() {
        this.playTone(200, 0.1, "square");
    },
    shieldOn() {
        this.playTone(800, 0.3, "sine");
    },
    shieldOff() {
        this.playTone(400, 0.2, "sine");
    },
    lifeline() {
        this.playTone(600, 0.4, "triangle");
    },
    victory() {
        this.playTone(523, 0.5, "sine");
    },
};

// Input handling
const input = {
    init() {
        // Keyboard events
        document.addEventListener("keydown", (e) => {
            gameConfig.keys[e.code] = true;
            if (e.code === "KeyL") {
                this.toggleLifelinePopup();
            }
            if (e.code === "Space") {
                e.preventDefault();
                this.attack();
            }
        });

        document.addEventListener("keyup", (e) => {
            gameConfig.keys[e.code] = false;
        });

        // Mobile joystick
        this.initJoystick();

        // Attack button
        document
            .getElementById("attackButton")
            .addEventListener("touchstart", (e) => {
                e.preventDefault();
                this.attack();
            });

        document
            .getElementById("attackButton")
            .addEventListener("click", (e) => {
                e.preventDefault();
                this.attack();
            });

        // Lifeline button
        document
            .getElementById("lifelineButton")
            .addEventListener("click", () => {
                this.toggleLifelinePopup();
            });

        // Lifeline popup buttons
        document.getElementById("massBunkBtn").addEventListener("click", () => {
            this.useLifeline("massBunk");
        });

        document
            .getElementById("canteenStrikeBtn")
            .addEventListener("click", () => {
                this.useLifeline("canteenStrike");
            });

        document.getElementById("closePopup").addEventListener("click", () => {
            this.closeLifelinePopup();
        });

        // Restart button
        document
            .getElementById("restartButton")
            .addEventListener("click", () => {
                this.restartGame();
            });
    },

    initJoystick() {
        const joystick = document.getElementById("joystick");
        const knob = document.getElementById("joystickKnob");
        let isDragging = false;

        const handleStart = (e) => {
            isDragging = true;
            e.preventDefault();
        };

        const handleMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();

            const rect = joystick.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            let clientX, clientY;
            if (e.touches) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }

            const deltaX = clientX - centerX;
            const deltaY = clientY - centerY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const maxDistance = 25;

            if (distance <= maxDistance) {
                knob.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
                gameConfig.joystick = {
                    active: true,
                    x: deltaX / maxDistance,
                    y: deltaY / maxDistance,
                };
            } else {
                const angle = Math.atan2(deltaY, deltaX);
                const limitedX = Math.cos(angle) * maxDistance;
                const limitedY = Math.sin(angle) * maxDistance;
                knob.style.transform = `translate(calc(-50% + ${limitedX}px), calc(-50% + ${limitedY}px))`;
                gameConfig.joystick = {
                    active: true,
                    x: limitedX / maxDistance,
                    y: limitedY / maxDistance,
                };
            }
        };

        const handleEnd = (e) => {
            isDragging = false;
            knob.style.transform = "translate(-50%, -50%)";
            gameConfig.joystick = { active: false, x: 0, y: 0 };
        };

        // Touch events
        joystick.addEventListener("touchstart", handleStart);
        document.addEventListener("touchmove", handleMove);
        document.addEventListener("touchend", handleEnd);

        // Mouse events for desktop testing
        joystick.addEventListener("mousedown", handleStart);
        document.addEventListener("mousemove", handleMove);
        document.addEventListener("mouseup", handleEnd);
    },

    attack() {
        if (gameConfig.jithin.attackCooldown <= 0) {
            gameConfig.jithin.isAttacking = true;
            gameConfig.jithin.attackCooldown = 500; // 0.5 second cooldown

            // Check if Renjith is in range
            const distance = Math.abs(
                gameConfig.jithin.x - gameConfig.renjith.x,
            );
            if (distance < 120) {
                this.handleAttackHit();
            }

            sound.punch();
        }
    },

    handleAttackHit() {
        let damage = 5; // 5% damage for equal difficulty

        // Check if Renjith has shield (Shaaji mode)
        if (gameConfig.jithin.shaajiMode && gameConfig.jithin.shieldHits > 0) {
            // Attack blocked by shield
            gameConfig.jithin.shieldHits--;
            ui.showMessage("Shield absorbed hit! 🛡️");

            if (gameConfig.jithin.shieldHits <= 0) {
                gameConfig.jithin.shaajiMode = false;
                ui.showMessage(window.GAME_PHRASES.shield_broken);
                sound.shieldOff();
            }
            return;
        }

        // Deal damage to Renjith
        gameConfig.renjith.health = Math.max(
            0,
            gameConfig.renjith.health - damage,
        );

        // Increment combo for Jithin
        gameConfig.jithin.comboCount++;

        // Check for Shaaji mode activation (3-hit combo)
        if (
            gameConfig.jithin.comboCount >= 3 &&
            !gameConfig.jithin.shaajiMode
        ) {
            gameConfig.jithin.shaajiMode = true;
            gameConfig.jithin.shieldHits = 2;
            gameConfig.jithin.comboCount = 0; // Reset combo
            ui.showMessage(window.GAME_PHRASES.shaaji_mode);
            sound.shieldOn();
        }

        ui.updateHealthBars();

        if (gameConfig.renjith.health <= 0) {
            game.endGame("jithin");
        }
    },

    toggleLifelinePopup() {
        const popup = document.getElementById("lifelinePopup");
        popup.classList.toggle("hidden");

        // Update button states
        document.getElementById("massBunkBtn").disabled =
            gameConfig.lifelines.massBunk <= 0;
        document.getElementById("canteenStrikeBtn").disabled =
            gameConfig.lifelines.canteenStrike <= 0;

        // Update counter text
        document.querySelector("#massBunkBtn span").textContent =
            `Mass Bunk (${gameConfig.lifelines.massBunk})`;
        document.querySelector("#canteenStrikeBtn span").textContent =
            `Canteen Strike (${gameConfig.lifelines.canteenStrike})`;
    },

    closeLifelinePopup() {
        document.getElementById("lifelinePopup").classList.add("hidden");
    },

    useLifeline(type) {
        if (type === "massBunk" && gameConfig.lifelines.massBunk > 0) {
            gameConfig.lifelines.massBunk--;
            gameConfig.renjith.health = Math.max(
                0,
                gameConfig.renjith.health - 10,
            );
            ui.showMessage(window.GAME_PHRASES.mass_bunk);
            sound.lifeline();
        } else if (
            type === "canteenStrike" &&
            gameConfig.lifelines.canteenStrike > 0
        ) {
            gameConfig.lifelines.canteenStrike--;
            gameConfig.jithin.health = Math.min(
                100,
                gameConfig.jithin.health + 15,
            );
            ui.showMessage(window.GAME_PHRASES.canteen_strike);
            sound.lifeline();
        }

        ui.updateHealthBars();
        this.closeLifelinePopup();

        // Check for game end
        if (gameConfig.renjith.health <= 0) {
            game.endGame("jithin");
        }
    },

    restartGame() {
        game.restart();
    },
};

// UI management
const ui = {
    updateHealthBars() {
        // Jithin health
        const jithinPercent =
            (gameConfig.jithin.health / gameConfig.jithin.maxHealth) * 100;
        document.getElementById("jithinHealthFill").style.width =
            jithinPercent + "%";
        document.getElementById("jithinHealthPercent").textContent =
            Math.round(jithinPercent) + "%";

        // Renjith health
        const renjithPercent =
            (gameConfig.renjith.health / gameConfig.renjith.maxHealth) * 100;
        document.getElementById("renjithHealthFill").style.width =
            renjithPercent + "%";
        document.getElementById("renjithHealthPercent").textContent =
            Math.round(renjithPercent) + "%";
    },

    showMessage(text, duration = 2000) {
        const messageEl = document.getElementById("gameMessage");
        messageEl.textContent = text;
        messageEl.classList.remove("hidden");

        setTimeout(() => {
            messageEl.classList.add("hidden");
        }, duration);
    },

    showGameOver(winner) {
        const gameOverScreen = document.getElementById("gameOverScreen");
        const gameOverText = document.getElementById("gameOverText");

        if (winner === "jithin") {
            gameOverText.textContent = window.GAME_PHRASES.jithin_wins;
        } else {
            gameOverText.textContent = window.GAME_PHRASES.renjith_wins;
        }

        gameOverScreen.classList.remove("hidden");
        sound.victory();
    },
};

// Renderer
const renderer = {
    drawCharacter(character, isJithin = true) {
        const ctx = gameConfig.ctx;

        // Choose sprite based on character state
        let spriteName;
        if (isJithin) {
            if (character.shaajiMode) {
                spriteName = "jithin_shield";
            } else if (character.isAttacking) {
                spriteName = "jithin_attack";
            } else {
                spriteName = "jithin_idle";
            }
        } else {
            if (character.isAttacking) {
                spriteName = "renjith_attack";
            } else {
                spriteName = "renjith_idle";
            }
        }

        // Draw the sprite if loaded
        if (assets.images[spriteName]) {
            // Calculate sprite position and size
            const spriteWidth = character.width;
            const spriteHeight = character.height;

            // Flip sprite if character is facing left
            if (character.facing === -1) {
                ctx.save();
                ctx.scale(-1, 1);
                ctx.drawImage(
                    assets.images[spriteName],
                    -(character.x + spriteWidth),
                    character.y,
                    spriteWidth,
                    spriteHeight,
                );
                ctx.restore();
            } else {
                ctx.drawImage(
                    assets.images[spriteName],
                    character.x,
                    character.y,
                    spriteWidth,
                    spriteHeight,
                );
            }
        } else {
            // Fallback to basic rectangles if sprites fail to load
            ctx.fillStyle = isJithin ? "#4169E1" : "#228B22";
            ctx.fillRect(
                character.x,
                character.y + 40,
                character.width,
                character.height - 40,
            );
            ctx.fillStyle = "#FFE4C4";
            ctx.fillRect(character.x + 15, character.y, 50, 50);
        }
    },

    drawBackground() {
        const ctx = gameConfig.ctx;

        // Draw pixel art background if loaded
        if (assets.images["background"]) {
            // Scale the background to fit the canvas
            ctx.drawImage(
                assets.images["background"],
                0,
                0,
                gameConfig.width,
                gameConfig.height,
            );
        } else {
            // Fallback to gradient background if image fails to load
            const gradient = ctx.createLinearGradient(
                0,
                0,
                0,
                gameConfig.height,
            );
            gradient.addColorStop(0, "#87CEEB");
            gradient.addColorStop(0.5, "#98FB98");
            gradient.addColorStop(1, "#8FBC8F");

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, gameConfig.width, gameConfig.height);

            // Ground
            ctx.fillStyle = "#654321";
            ctx.fillRect(0, gameConfig.height - 80, gameConfig.width, 80);
        }
    },

    render() {
        const ctx = gameConfig.ctx;

        // Clear canvas
        ctx.clearRect(0, 0, gameConfig.width, gameConfig.height);

        // Draw background
        this.drawBackground();

        // Draw characters
        this.drawCharacter(gameConfig.jithin, true);
        this.drawCharacter(gameConfig.renjith, false);

        // Debug info (can be removed)
        if (false) {
            // Set to true for debugging
            ctx.fillStyle = "#000";
            ctx.font = "12px monospace";
            ctx.fillText(
                `Jithin: ${gameConfig.jithin.health}HP, Combo: ${gameConfig.jithin.comboCount}`,
                10,
                20,
            );
            ctx.fillText(`Renjith: ${gameConfig.renjith.health}HP`, 10, 35);
            ctx.fillText(
                `Shaaji Mode: ${gameConfig.jithin.shaajiMode ? "ON" : "OFF"}`,
                10,
                50,
            );
        }
    },
};

// AI for Renjith
const ai = {
    update(deltaTime) {
        // Basic AI behavior for Renjith
        const renjith = gameConfig.renjith;
        const jithin = gameConfig.jithin;

        // Reduce attack cooldown
        if (renjith.attackCooldown > 0) {
            renjith.attackCooldown -= deltaTime;
        }

        // Move towards Jithin
        const distance = Math.abs(renjith.x - jithin.x);
        const speed = 30; // pixels per second

        if (distance > 100) {
            // Move closer
            if (renjith.x > jithin.x) {
                renjith.x -= (speed * deltaTime) / 1000;
                renjith.facing = -1;
            } else {
                renjith.x += (speed * deltaTime) / 1000;
                renjith.facing = 1;
            }
            renjith.isMoving = true;
        } else {
            renjith.isMoving = false;

            // Attack if in range and cooldown is ready
            if (renjith.attackCooldown <= 0) {
                this.attack();
            }
        }

        // Use special attacks only when hero is far away (strategic lifeline usage)
        if (Date.now() - renjith.lastSpecialAttack > 8000 && distance > 150) {
            // Every 8 seconds when hero is far
            this.specialAttack();
            renjith.lastSpecialAttack = Date.now();
        }

        // Keep Renjith on screen
        renjith.x = Math.max(
            0,
            Math.min(gameConfig.width - renjith.width, renjith.x),
        );
    },

    attack() {
        const renjith = gameConfig.renjith;
        const jithin = gameConfig.jithin;

        renjith.isAttacking = true;
        renjith.attackCooldown = 1000; // 1 second cooldown for AI

        // Check if in range
        const distance = Math.abs(renjith.x - jithin.x);
        if (distance < 120) {
            // Deal damage to Jithin
            let damage = 5; // 5% damage for villain attacks

            // Check if Jithin has shield
            if (jithin.shaajiMode && jithin.shieldHits > 0) {
                jithin.shieldHits--;
                ui.showMessage("Shield absorbed hit! 🛡️");

                if (jithin.shieldHits <= 0) {
                    jithin.shaajiMode = false;
                    ui.showMessage(window.GAME_PHRASES.shield_broken);
                    sound.shieldOff();
                }
                return;
            }

            jithin.health = Math.max(0, jithin.health - damage);
            ui.updateHealthBars();
            sound.punch();

            if (jithin.health <= 0) {
                game.endGame("renjith");
            }
        }

        // Reset attack animation after short delay
        setTimeout(() => {
            renjith.isAttacking = false;
        }, 200);
    },

    specialAttack() {
        const damage = 10;
        const jithin = gameConfig.jithin;

        // Choose random special attack
        if (Math.random() < 0.5) {
            // Viva Fail
            jithin.health = Math.max(0, jithin.health - damage);
            ui.showMessage(window.GAME_PHRASES.viva_fail);
        } else {
            // Attendance Shortage
            jithin.health = Math.max(0, jithin.health - damage);
            ui.showMessage(window.GAME_PHRASES.attendance_shortage);
        }

        ui.updateHealthBars();
        sound.lifeline();

        if (jithin.health <= 0) {
            game.endGame("renjith");
        }
    },
};

// Main game object
const game = {
    async init() {
        // Initialize canvas
        gameConfig.canvas = document.getElementById("gameCanvas");
        gameConfig.ctx = gameConfig.canvas.getContext("2d");

        // Set canvas size
        this.resizeCanvas();
        window.addEventListener("resize", () => this.resizeCanvas());

        // Initialize subsystems
        sound.init();
        input.init();

        // Load assets
        await assets.loadAll();

        // Initialize UI
        ui.updateHealthBars();
        ui.showMessage(window.GAME_PHRASES.fight_start, 3000);

        // Start game loop
        gameConfig.running = true;
        gameConfig.lastTime = performance.now();
        this.gameLoop();

        console.log("Game initialized successfully");
    },

    resizeCanvas() {
        const container = document.getElementById("gameContainer");
        gameConfig.canvas.width = container.clientWidth;
        gameConfig.canvas.height = container.clientHeight;
        gameConfig.width = gameConfig.canvas.width;
        gameConfig.height = gameConfig.canvas.height;

        // Adjust character positions for different screen sizes
        if (gameConfig.width < 800) {
            gameConfig.jithin.x = Math.min(
                gameConfig.jithin.x,
                gameConfig.width * 0.2,
            );
            gameConfig.renjith.x = Math.max(
                gameConfig.renjith.x,
                gameConfig.width * 0.7,
            );
        }
    },

    gameLoop() {
        if (!gameConfig.running) return;

        const currentTime = performance.now();
        const deltaTime = currentTime - gameConfig.lastTime;
        gameConfig.lastTime = currentTime;

        // Update game state
        this.update(deltaTime);

        // Render
        renderer.render();

        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    },

    update(deltaTime) {
        // Update attack cooldowns
        if (gameConfig.jithin.attackCooldown > 0) {
            gameConfig.jithin.attackCooldown -= deltaTime;
        }

        // Reset attack animation
        if (
            gameConfig.jithin.isAttacking &&
            gameConfig.jithin.attackCooldown <= 300
        ) {
            gameConfig.jithin.isAttacking = false;
        }

        // Handle Jithin movement
        this.handlePlayerMovement(deltaTime);

        // Update AI
        ai.update(deltaTime);

        // Keep characters on screen
        gameConfig.jithin.x = Math.max(
            0,
            Math.min(
                gameConfig.width - gameConfig.jithin.width,
                gameConfig.jithin.x,
            ),
        );
        gameConfig.renjith.x = Math.max(
            0,
            Math.min(
                gameConfig.width - gameConfig.renjith.width,
                gameConfig.renjith.x,
            ),
        );
    },

    handlePlayerMovement(deltaTime) {
        const jithin = gameConfig.jithin;
        const speed = 100; // pixels per second
        let isMoving = false;

        // Desktop controls
        if (gameConfig.keys["ArrowLeft"] || gameConfig.keys["KeyA"]) {
            jithin.x -= (speed * deltaTime) / 1000;
            jithin.facing = -1;
            isMoving = true;
        }
        if (gameConfig.keys["ArrowRight"] || gameConfig.keys["KeyD"]) {
            jithin.x += (speed * deltaTime) / 1000;
            jithin.facing = 1;
            isMoving = true;
        }

        // Mobile joystick controls
        if (gameConfig.joystick.active) {
            jithin.x += (gameConfig.joystick.x * speed * deltaTime) / 1000;
            if (gameConfig.joystick.x > 0.1) {
                jithin.facing = 1;
                isMoving = true;
            } else if (gameConfig.joystick.x < -0.1) {
                jithin.facing = -1;
                isMoving = true;
            }
        }

        jithin.isMoving = isMoving;

        // Update animation frame
        if (isMoving) {
            jithin.animFrame += deltaTime;
            if (jithin.animFrame > gameConfig.animationSpeed) {
                jithin.animFrame = 0;
            }
        }
    },

    endGame(winner) {
        gameConfig.running = false;
        ui.showGameOver(winner);
    },

    restart() {
        // Reset game state
        gameConfig.jithin.health = 100;
        gameConfig.jithin.x = 150;
        gameConfig.jithin.comboCount = 0;
        gameConfig.jithin.shaajiMode = false;
        gameConfig.jithin.shieldHits = 0;
        gameConfig.jithin.isAttacking = false;
        gameConfig.jithin.attackCooldown = 0;

        gameConfig.renjith.health = 100;
        gameConfig.renjith.x = 570;
        gameConfig.renjith.isAttacking = false;
        gameConfig.renjith.attackCooldown = 0;
        gameConfig.renjith.lastSpecialAttack = 0;

        gameConfig.lifelines.massBunk = 1;
        gameConfig.lifelines.canteenStrike = 1;

        // Hide game over screen
        document.getElementById("gameOverScreen").classList.add("hidden");

        // Update UI
        ui.updateHealthBars();
        ui.showMessage(window.GAME_PHRASES.fight_start, 3000);

        // Restart game loop
        gameConfig.running = true;
        gameConfig.lastTime = performance.now();
        this.gameLoop();
    },
};

// Start screen functionality
const startScreen = {
    init() {
        const startButton = document.getElementById("startButton");
        const startScreenEl = document.getElementById("startScreen");
        const gameContainer = document.getElementById("gameContainer");

        startButton.addEventListener("click", () => {
            startScreenEl.classList.add("hidden");
            gameContainer.classList.remove("hidden");
            game.init()
                .then(() => {
                    sound.playBackgroundMusic();
                })
                .catch(console.error);
        });
    },
};

// Initialize start screen when page loads
window.addEventListener("load", () => {
    startScreen.init();
});
