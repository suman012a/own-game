/**
 * NAIL BLAST — BOUNCING BALL VS SPIKES
 * Physics Engine, Ball Shard Blast Explosion, Multi-Mode & Sound Synthesizer
 */

(function () {
    'use strict';

    // =========================================================================
    // 1. PROCEDURAL SOUND SYNTHESIZER (Web Audio API)
    // =========================================================================
    class SoundEngine {
        constructor() {
            this.ctx = null;
            this.enabled = true;
            this.init();
        }

        init() {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }

        resume() {
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }

        playJump() {
            if (!this.enabled || !this.ctx) return;
            this.resume();

            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            // Uplifting spring / flap boing
            osc.type = 'sine';
            osc.frequency.setValueAtTime(260, t);
            osc.frequency.exponentialRampToValueAtTime(540, t + 0.08);

            gain.gain.setValueAtTime(0.3, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.1);
        }

        playWallBounce() {
            if (!this.enabled || !this.ctx) return;
            this.resume();

            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            // Crisp arcade wall chime
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(780, t);
            osc.frequency.exponentialRampToValueAtTime(980, t + 0.06);

            gain.gain.setValueAtTime(0.25, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.09);
        }

        playGemCollect() {
            if (!this.enabled || !this.ctx) return;
            this.resume();

            const t = this.ctx.currentTime;
            const notes = [1046.5, 1567.98]; // C6 -> G6 sparkle
            notes.forEach((freq, idx) => {
                const noteTime = t + idx * 0.05;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, noteTime);
                gain.gain.setValueAtTime(0.28, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.14);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(noteTime);
                osc.stop(noteTime + 0.15);
            });
        }

        playNailSprout() {
            if (!this.enabled || !this.ctx) return;
            this.resume();

            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            // Metallic razor slide
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(900, t);
            osc.frequency.exponentialRampToValueAtTime(350, t + 0.05);

            gain.gain.setValueAtTime(0.12, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.07);
        }

        playNailBlast() {
            if (!this.enabled || !this.ctx) return;
            this.resume();

            const t = this.ctx.currentTime;

            // 1. Heavy Sub-Bass Boom
            const sub = this.ctx.createOscillator();
            const subGain = this.ctx.createGain();
            sub.type = 'triangle';
            sub.frequency.setValueAtTime(140, t);
            sub.frequency.exponentialRampToValueAtTime(25, t + 0.35);
            subGain.gain.setValueAtTime(0.85, t);
            subGain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
            sub.connect(subGain);
            subGain.connect(this.ctx.destination);
            sub.start(t);
            sub.stop(t + 0.45);

            // 2. White noise explosion burst
            const bufferSize = this.ctx.sampleRate * 0.35;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2200, t);
            filter.frequency.exponentialRampToValueAtTime(300, t + 0.3);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.7, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);
            noise.start(t);

            // 3. High-pitch glass / metal shatter
            const shatter = this.ctx.createOscillator();
            const shatterGain = this.ctx.createGain();
            shatter.type = 'sawtooth';
            shatter.frequency.setValueAtTime(2400, t);
            shatter.frequency.exponentialRampToValueAtTime(600, t + 0.18);
            shatterGain.gain.setValueAtTime(0.3, t);
            shatterGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
            shatter.connect(shatterGain);
            shatterGain.connect(this.ctx.destination);
            shatter.start(t);
            shatter.stop(t + 0.2);
        }
    }

    const sound = new SoundEngine();

    // =========================================================================
    // 2. GAME STATE & SETTINGS
    // =========================================================================
    const state = {
        mode: 'classic',        // 'classic' | 'pvp' | 'rain' | 'twin'
        skin: 'neon',           // 'neon' | 'fire' | 'cyber' | 'candy' | 'gold'
        difficulty: 'normal',   // 'easy' | 'normal' | 'hard'
        
        isPlaying: false,
        isGameOver: false,
        score: 0,
        highScore: parseInt(localStorage.getItem('nail_blast_highscore') || '0', 10),
        gems: parseInt(localStorage.getItem('nail_blast_gems') || '0', 10),
        multiplier: 1,

        p2Score: 0,
        p2Wins: 0,

        // Arena dimensions (virtual units)
        arenaWidth: 540,
        arenaHeight: 720,
        spikeSize: 28,

        // Screen shake
        shake: 0,

        // Objects
        balls: [],
        wallSpikesLeft: [],
        wallSpikesRight: [],
        ceilingSpikes: [],
        floorSpikes: [],
        fallingSpikes: [],
        gemsList: [],
        shards: [],
        shockwaves: [],
        sparkles: []
    };

    // =========================================================================
    // 3. DOM REFERENCES
    // =========================================================================
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    const currentScoreEl = document.getElementById('current-score');
    const highScoreValEl = document.getElementById('high-score-val');
    const gemCountEl = document.getElementById('gem-count');
    const multiplierTextEl = document.getElementById('multiplier-text');
    const multiplierBadge = document.getElementById('multiplier-badge');

    const p1HudCard = document.getElementById('p1-hud-card');
    const p1HudLabel = document.getElementById('p1-hud-label');
    const p2HudCard = document.getElementById('p2-hud-card');
    const p2ScoreEl = document.getElementById('p2-score');
    const p2WinsValEl = document.getElementById('p2-wins-val');

    const startPrompt = document.getElementById('start-prompt');
    const promptMainText = document.getElementById('prompt-main-text');
    const promptSubText = document.getElementById('prompt-sub-text');
    const blastOverlay = document.getElementById('blast-overlay');

    const soloLegend = document.getElementById('solo-legend');
    const pvpLegend = document.getElementById('pvp-legend');

    const gameOverModal = document.getElementById('game-over-modal');
    const gameOverSub = document.getElementById('game-over-sub');
    const modalFinalScore = document.getElementById('modal-final-score');
    const modalBestScore = document.getElementById('modal-best-score');
    const modalGemsCollected = document.getElementById('modal-gems-collected');
    const modalMedal = document.getElementById('modal-medal');
    const btnPlayAgain = document.getElementById('btn-play-again');

    const rulesModal = document.getElementById('rules-modal');
    const btnRules = document.getElementById('btn-rules');
    const btnCloseRules = document.getElementById('btn-close-rules');
    const btnGotRules = document.getElementById('btn-got-rules');
    const btnRestartTop = document.getElementById('btn-restart-top');

    const btnSound = document.getElementById('btn-sound');
    const soundIcon = document.getElementById('sound-icon');
    const modeSelect = document.getElementById('mode-select');
    const skinSelect = document.getElementById('skin-select');
    const diffSelect = document.getElementById('diff-select');

    // =========================================================================
    // 4. BALL CREATION & CONTROLS
    // =========================================================================
    function createBall(id, x, y, color, controls) {
        return {
            id,
            x,
            y,
            radius: 17,
            vx: 3.9,
            vy: 0,
            scaleX: 1.0,
            scaleY: 1.0,
            color,
            controls,
            alive: true,
            trail: []
        };
    }

    function initBalls() {
        state.balls = [];
        const cx = state.arenaWidth / 2;
        const cy = state.arenaHeight / 2;

        if (state.mode === 'pvp') {
            // Player 1 (Cyan) and Player 2 (Orange)
            state.balls.push(createBall(1, cx - 60, cy, '#00f2fe', 'p1'));
            state.balls.push(createBall(2, cx + 60, cy, '#f59e0b', 'p2'));
            state.balls[1].vx = -3.9; // move in opposite direction
        } else if (state.mode === 'twin') {
            // Twin balls
            state.balls.push(createBall(1, cx, cy - 50, '#00f2fe', 'p1'));
            state.balls.push(createBall(2, cx, cy + 50, '#a855f7', 'p1'));
        } else {
            // Single Player (Classic or Rain)
            state.balls.push(createBall(1, cx, cy, '#00f2fe', 'p1'));
        }
    }

    function bounceBall(ball) {
        if (!ball.alive) return;
        sound.resume();
        sound.playJump();

        ball.vy = -7.8;
        ball.scaleX = 0.72;
        ball.scaleY = 1.35; // stretch upwards

        // Spawn jump air dust
        for (let i = 0; i < 6; i++) {
            state.sparkles.push({
                x: ball.x + (Math.random() - 0.5) * 16,
                y: ball.y + ball.radius,
                vx: (Math.random() - 0.5) * 3,
                vy: Math.random() * 2 + 1,
                size: Math.random() * 3 + 1.5,
                color: 'rgba(255, 255, 255, 0.7)',
                life: 1.0,
                decay: 0.05
            });
        }
    }

    // =========================================================================
    // 5. NAILS & SPIKES GENERATOR
    // =========================================================================
    function initBoundarySpikes() {
        // Ceiling Spikes (pointing down)
        state.ceilingSpikes = [];
        const spikeW = state.spikeSize;
        const countX = Math.floor(state.arenaWidth / spikeW);
        const offsetX = (state.arenaWidth - countX * spikeW) / 2;

        for (let i = 0; i < countX; i++) {
            state.ceilingSpikes.push({
                x1: offsetX + i * spikeW,
                y1: 0,
                x2: offsetX + (i + 1) * spikeW,
                y2: 0,
                tipX: offsetX + (i + 0.5) * spikeW,
                tipY: spikeW
            });
        }

        // Floor Spikes (pointing up)
        state.floorSpikes = [];
        for (let i = 0; i < countX; i++) {
            state.floorSpikes.push({
                x1: offsetX + i * spikeW,
                y1: state.arenaHeight,
                x2: offsetX + (i + 1) * spikeW,
                y2: state.arenaHeight,
                tipX: offsetX + (i + 0.5) * spikeW,
                tipY: state.arenaHeight - spikeW
            });
        }
    }

    function generateWallSpikes(side) {
        // side: 'left' or 'right'
        const spikeH = state.spikeSize * 1.3;
        const totalSlots = Math.floor((state.arenaHeight - 120) / spikeH);
        const startY = 60;

        let spikeCount = 3;
        if (state.difficulty === 'easy') spikeCount = 2 + Math.floor(Math.random() * 2);
        else if (state.difficulty === 'normal') spikeCount = 3 + Math.floor(Math.random() * 3);
        else if (state.difficulty === 'hard') spikeCount = 5 + Math.floor(Math.random() * 3);

        // Pick distinct random slots
        const slots = [];
        for (let i = 0; i < totalSlots; i++) slots.push(i);
        // Shuffle
        for (let i = slots.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [slots[i], slots[j]] = [slots[j], slots[i]];
        }

        const chosen = slots.slice(0, spikeCount);
        const spikes = [];

        chosen.forEach((slot) => {
            const y1 = startY + slot * spikeH;
            const y2 = y1 + spikeH;
            const midY = (y1 + y2) / 2;

            if (side === 'left') {
                spikes.push({
                    side: 'left',
                    x1: 0, y1,
                    x2: 0, y2,
                    tipX: state.spikeSize * 1.1,
                    tipY: midY,
                    progress: 0 // animated slide-in
                });
            } else {
                spikes.push({
                    side: 'right',
                    x1: state.arenaWidth, y1,
                    x2: state.arenaWidth, y2,
                    tipX: state.arenaWidth - state.spikeSize * 1.1,
                    tipY: midY,
                    progress: 0 // animated slide-in
                });
            }
        });

        sound.playNailSprout();
        return spikes;
    }

    function spawnGem() {
        if (state.gemsList.length >= 2) return;
        const marginX = 80;
        const marginY = 120;
        state.gemsList.push({
            x: marginX + Math.random() * (state.arenaWidth - marginX * 2),
            y: marginY + Math.random() * (state.arenaHeight - marginY * 2),
            radius: 12,
            rot: 0,
            pulse: 0
        });
    }

    // =========================================================================
    // 6. THE BLAST / EXPLOSION SYSTEM
    // =========================================================================
    function triggerBallBlast(ball, cause = 'NAIL') {
        if (!ball.alive) return;
        ball.alive = false;

        sound.playNailBlast();
        state.shake = 22; // High-intensity screen shake

        // 1. Spawn Explosive Shards (40+ physics fragments)
        const shardCount = 42;
        for (let i = 0; i < shardCount; i++) {
            const angle = (i / shardCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
            const speed = Math.random() * 8.5 + 4.5;
            state.shards.push({
                x: ball.x,
                y: ball.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2.5,
                rot: Math.random() * Math.PI * 2,
                vrot: (Math.random() - 0.5) * 0.45,
                size: Math.random() * 8 + 4,
                color: ball.color,
                life: 1.0,
                decay: 0.018 + Math.random() * 0.015
            });
        }

        // 2. Spawn Shockwave Rings
        state.shockwaves.push({
            x: ball.x,
            y: ball.y,
            radius: 10,
            maxRadius: 140,
            color: ball.color,
            life: 1.0
        });

        // 3. Smoke & Fire particles
        for (let i = 0; i < 28; i++) {
            state.sparkles.push({
                x: ball.x,
                y: ball.y,
                vx: (Math.random() - 0.5) * 7,
                vy: (Math.random() - 0.5) * 7 - 2,
                size: Math.random() * 6 + 3,
                color: Math.random() < 0.5 ? '#ff0055' : '#fbbf24',
                life: 1.0,
                decay: 0.035
            });
        }

        // 4. Blast overlay flash
        blastOverlay.classList.add('active');
        setTimeout(() => {
            blastOverlay.classList.remove('active');
        }, 600);

        // Check PvP win or Solo Game Over
        if (state.mode === 'pvp') {
            const winnerId = ball.id === 1 ? 2 : 1;
            if (winnerId === 2) state.p2Wins++;
            endMatchPvp(winnerId);
        } else {
            // Check if any other balls alive in Twin mode
            const anyAlive = state.balls.some(b => b.alive);
            if (!anyAlive) {
                endGameSolo();
            }
        }
    }

    function endGameSolo() {
        state.isPlaying = false;
        state.isGameOver = true;

        if (state.score > state.highScore) {
            state.highScore = state.score;
            localStorage.setItem('nail_blast_highscore', state.highScore);
        }
        localStorage.setItem('nail_blast_gems', state.gems);

        // Medal assignment
        let medal = '🥉 Bronze';
        if (state.score >= 35) medal = '💎 Diamond Master';
        else if (state.score >= 20) medal = '🥇 Gold Champion';
        else if (state.score >= 10) medal = '🥈 Silver Pro';

        modalFinalScore.textContent = state.score;
        modalBestScore.textContent = state.highScore;
        modalGemsCollected.textContent = state.gems;
        modalMedal.textContent = medal;

        setTimeout(() => {
            gameOverModal.classList.add('active');
        }, 750);
    }

    function endMatchPvp(winnerId) {
        state.isPlaying = false;
        state.isGameOver = true;

        gameOverSub.textContent = `PLAYER ${winnerId} SURVIVED!`;
        modalFinalScore.textContent = `P${winnerId} WINS`;
        modalBestScore.textContent = `Wins: ${state.p2Wins}`;
        modalGemsCollected.textContent = state.gems;
        modalMedal.textContent = '🏆 Champion';

        setTimeout(() => {
            gameOverModal.classList.add('active');
        }, 750);
    }

    // =========================================================================
    // 7. COLLISION DETECTION (Circle vs Polygon Nails)
    // =========================================================================
    function pointInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
        const area = 0.5 * (-y2 * x3 + y1 * (-x2 + x3) + x1 * (y2 - y3) + x2 * y3);
        const s = 1 / (2 * area) * (y1 * x3 - x1 * y3 + (y3 - y1) * px + (x1 - x3) * py);
        const t = 1 / (2 * area) * (x1 * y2 - y1 * x2 + (y1 - y2) * px + (x2 - x1) * py);
        return s >= 0 && t >= 0 && (1 - s - t) >= 0;
    }

    function distToSegment(px, py, x1, y1, x2, y2) {
        const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
        if (l2 === 0) return Math.hypot(px - x1, py - y1);
        let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
    }

    function checkCircleTriangleCollision(cx, cy, r, x1, y1, x2, y2, x3, y3) {
        // If center is inside triangle
        if (pointInTriangle(cx, cy, x1, y1, x2, y2, x3, y3)) return true;
        // Check distance to all 3 edges
        if (distToSegment(cx, cy, x1, y1, x2, y2) <= r) return true;
        if (distToSegment(cx, cy, x2, y2, x3, y3) <= r) return true;
        if (distToSegment(cx, cy, x3, y3, x1, y1) <= r) return true;
        return false;
    }

    function checkSpikeCollisions(ball) {
        if (!ball.alive) return;

        // 1. Ceiling Spikes
        for (const spike of state.ceilingSpikes) {
            if (checkCircleTriangleCollision(ball.x, ball.y, ball.radius, spike.x1, spike.y1, spike.x2, spike.y2, spike.tipX, spike.tipY)) {
                triggerBallBlast(ball, 'CEILING_NAIL');
                return;
            }
        }

        // 2. Floor Spikes
        for (const spike of state.floorSpikes) {
            if (checkCircleTriangleCollision(ball.x, ball.y, ball.radius, spike.x1, spike.y1, spike.x2, spike.y2, spike.tipX, spike.tipY)) {
                triggerBallBlast(ball, 'FLOOR_NAIL');
                return;
            }
        }

        // 3. Wall Spikes (Active side)
        const wallSpikes = ball.vx < 0 ? state.wallSpikesLeft : state.wallSpikesRight;
        for (const spike of wallSpikes) {
            const currentTipX = spike.side === 'left' ? spike.tipX * spike.progress : state.arenaWidth - (state.arenaWidth - spike.tipX) * spike.progress;
            if (checkCircleTriangleCollision(ball.x, ball.y, ball.radius, spike.x1, spike.y1, spike.x2, spike.y2, currentTipX, spike.tipY)) {
                triggerBallBlast(ball, 'WALL_NAIL');
                return;
            }
        }

        // 4. Falling Spikes (Rain Mode)
        for (const spike of state.fallingSpikes) {
            if (checkCircleTriangleCollision(ball.x, ball.y, ball.radius, spike.x - 12, spike.y, spike.x + 12, spike.y, spike.x, spike.y + 28)) {
                triggerBallBlast(ball, 'FALLING_NAIL');
                return;
            }
        }
    }

    // =========================================================================
    // 8. UPDATE LOOP
    // =========================================================================
    function updateGame() {
        if (!state.isPlaying) return;

        const g = 0.38;

        state.balls.forEach((ball) => {
            if (!ball.alive) return;

            // Gravity & Vertical movement
            ball.vy += g;
            ball.y += ball.vy;

            // Horizontal movement
            ball.x += ball.vx;

            // Squash & stretch recovery
            ball.scaleX += (1.0 - ball.scaleX) * 0.15;
            ball.scaleY += (1.0 - ball.scaleY) * 0.15;

            // Trail
            ball.trail.unshift({ x: ball.x, y: ball.y });
            if (ball.trail.length > 8) ball.trail.pop();

            // WALL BOUNCE LOGIC
            const leftWallX = ball.radius;
            const rightWallX = state.arenaWidth - ball.radius;

            if (ball.x <= leftWallX) {
                // Hit Left Wall
                ball.x = leftWallX;
                ball.vx = Math.abs(ball.vx);
                ball.scaleX = 0.7; // squish horizontally
                ball.scaleY = 1.3;
                sound.playWallBounce();

                // Swap spikes: Left spikes retract, Right spikes sprout!
                state.wallSpikesLeft = [];
                state.wallSpikesRight = generateWallSpikes('right');

                state.score++;
                spawnGem();
                updateHud();
            } else if (ball.x >= rightWallX) {
                // Hit Right Wall
                ball.x = rightWallX;
                ball.vx = -Math.abs(ball.vx);
                ball.scaleX = 0.7; // squish horizontally
                ball.scaleY = 1.3;
                sound.playWallBounce();

                // Swap spikes: Right spikes retract, Left spikes sprout!
                state.wallSpikesRight = [];
                state.wallSpikesLeft = generateWallSpikes('left');

                state.score++;
                spawnGem();
                updateHud();
            }

            // Spike Collisions
            checkSpikeCollisions(ball);

            // Gem Collect
            for (let i = state.gemsList.length - 1; i >= 0; i--) {
                const gem = state.gemsList[i];
                if (Math.hypot(ball.x - gem.x, ball.y - gem.y) < ball.radius + gem.radius) {
                    state.gems += state.multiplier;
                    sound.playGemCollect();
                    state.gemsList.splice(i, 1);
                    updateHud();

                    // Sparkle burst
                    for (let j = 0; j < 8; j++) {
                        state.sparkles.push({
                            x: gem.x,
                            y: gem.y,
                            vx: (Math.random() - 0.5) * 4,
                            vy: (Math.random() - 0.5) * 4,
                            size: Math.random() * 3 + 2,
                            color: '#38bdf8',
                            life: 1.0,
                            decay: 0.04
                        });
                    }
                }
            }
        });

        // 2-Player Ball-to-Ball Collision
        if (state.mode === 'pvp' && state.balls.length === 2) {
            const b1 = state.balls[0];
            const b2 = state.balls[1];
            if (b1.alive && b2.alive) {
                const dist = Math.hypot(b1.x - b2.x, b1.y - b2.y);
                if (dist < b1.radius + b2.radius) {
                    // Bounce apart!
                    const angle = Math.atan2(b2.y - b1.y, b2.x - b1.x);
                    b1.vx = -Math.cos(angle) * 4.5;
                    b1.vy = -Math.sin(angle) * 4.5;
                    b2.vx = Math.cos(angle) * 4.5;
                    b2.vy = Math.sin(angle) * 4.5;
                    sound.playWallBounce();
                }
            }
        }

        // Falling Spikes (Rain Mode)
        if (state.mode === 'rain') {
            if (Math.random() < 0.04) {
                state.fallingSpikes.push({
                    x: 40 + Math.random() * (state.arenaWidth - 80),
                    y: 20,
                    vy: 3.5 + Math.random() * 2
                });
            }
            for (let i = state.fallingSpikes.length - 1; i >= 0; i--) {
                const spike = state.fallingSpikes[i];
                spike.y += spike.vy;
                if (spike.y > state.arenaHeight) {
                    state.fallingSpikes.splice(i, 1);
                }
            }
        }

        // Animate slide-in wall spikes
        const allWallSpikes = [...state.wallSpikesLeft, ...state.wallSpikesRight];
        allWallSpikes.forEach((spike) => {
            if (spike.progress < 1.0) {
                spike.progress += 0.16;
                if (spike.progress > 1.0) spike.progress = 1.0;
            }
        });

        // Update Shards
        for (let i = state.shards.length - 1; i >= 0; i--) {
            const s = state.shards[i];
            s.x += s.vx;
            s.y += s.vy;
            s.vy += 0.35; // gravity on shards
            s.rot += s.vrot;
            s.life -= s.decay;

            // Bounce on floor
            if (s.y > state.arenaHeight - 20) {
                s.y = state.arenaHeight - 20;
                s.vy = -s.vy * 0.55;
                s.vx *= 0.8;
            }

            if (s.life <= 0) state.shards.splice(i, 1);
        }

        // Update Shockwaves
        for (let i = state.shockwaves.length - 1; i >= 0; i--) {
            const sw = state.shockwaves[i];
            sw.radius += (sw.maxRadius - sw.radius) * 0.14;
            sw.life -= 0.035;
            if (sw.life <= 0) state.shockwaves.splice(i, 1);
        }

        // Update Sparkles
        for (let i = state.sparkles.length - 1; i >= 0; i--) {
            const sp = state.sparkles[i];
            sp.x += sp.vx;
            sp.y += sp.vy;
            sp.life -= sp.decay;
            if (sp.life <= 0) state.sparkles.splice(i, 1);
        }

        // Screen Shake Decay
        if (state.shake > 0) {
            state.shake *= 0.88;
            if (state.shake < 0.2) state.shake = 0;
        }
    }

    // =========================================================================
    // 9. RENDER ENGINE
    // =========================================================================
    function resizeCanvas() {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = Math.floor(rect.width * window.devicePixelRatio);
        canvas.height = Math.floor(rect.height * window.devicePixelRatio);
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function render() {
        const w = canvas.width / window.devicePixelRatio;
        const h = canvas.height / window.devicePixelRatio;
        const scaleX = w / state.arenaWidth;
        const scaleY = h / state.arenaHeight;

        ctx.save();
        ctx.clearRect(0, 0, w, h);

        // Apply Screen Shake
        if (state.shake > 0) {
            const shakeX = (Math.random() - 0.5) * state.shake;
            const shakeY = (Math.random() - 0.5) * state.shake;
            ctx.translate(shakeX, shakeY);
        }

        ctx.scale(scaleX, scaleY);

        // 1. Arena Background Lines & Grid
        drawArenaGrid();

        // 2. Ceiling & Floor Spikes
        drawBoundarySpikes();

        // 3. Wall Spikes
        drawWallSpikes(state.wallSpikesLeft);
        drawWallSpikes(state.wallSpikesRight);

        // 4. Falling Spikes
        drawFallingSpikes();

        // 5. Gems
        drawGems();

        // 6. Shockwaves & Blast Rings
        drawShockwaves();

        // 7. Shards & Sparks
        drawShards();
        drawSparkles();

        // 8. Balls
        state.balls.forEach(drawBall);

        ctx.restore();
    }

    function drawArenaGrid() {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        const step = 45;
        for (let x = 0; x < state.arenaWidth; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, state.arenaHeight);
            ctx.stroke();
        }
        for (let y = 0; y < state.arenaHeight; y += step) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(state.arenaWidth, y);
            ctx.stroke();
        }

        // Center circular court emblem
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.08)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(state.arenaWidth / 2, state.arenaHeight / 2, 90, 0, Math.PI * 2);
        ctx.stroke();
    }

    function drawBoundarySpikes() {
        // Ceiling
        ctx.fillStyle = '#475569';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;

        for (const spike of state.ceilingSpikes) {
            ctx.beginPath();
            ctx.moveTo(spike.x1, spike.y1);
            ctx.lineTo(spike.x2, spike.y2);
            ctx.lineTo(spike.tipX, spike.tipY);
            ctx.closePath();

            const grad = ctx.createLinearGradient(spike.x1, spike.y1, spike.tipX, spike.tipY);
            grad.addColorStop(0, '#1e293b');
            grad.addColorStop(0.7, '#64748b');
            grad.addColorStop(1, '#f1f5f9');
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.stroke();
        }

        // Floor
        for (const spike of state.floorSpikes) {
            ctx.beginPath();
            ctx.moveTo(spike.x1, spike.y1);
            ctx.lineTo(spike.x2, spike.y2);
            ctx.lineTo(spike.tipX, spike.tipY);
            ctx.closePath();

            const grad = ctx.createLinearGradient(spike.x1, spike.y1, spike.tipX, spike.tipY);
            grad.addColorStop(0, '#1e293b');
            grad.addColorStop(0.7, '#64748b');
            grad.addColorStop(1, '#f1f5f9');
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.stroke();
        }
    }

    function drawWallSpikes(spikes) {
        for (const spike of spikes) {
            const currentTipX = spike.side === 'left' ? spike.tipX * spike.progress : state.arenaWidth - (state.arenaWidth - spike.tipX) * spike.progress;

            ctx.beginPath();
            ctx.moveTo(spike.x1, spike.y1);
            ctx.lineTo(spike.x2, spike.y2);
            ctx.lineTo(currentTipX, spike.tipY);
            ctx.closePath();

            const grad = ctx.createLinearGradient(spike.x1, spike.y1, currentTipX, spike.tipY);
            grad.addColorStop(0, '#0f172a');
            grad.addColorStop(0.6, '#ef4444');
            grad.addColorStop(1, '#f8fafc');

            ctx.fillStyle = grad;
            ctx.fill();

            ctx.strokeStyle = '#ff0055';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Shiny point glint
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(currentTipX, spike.tipY, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawFallingSpikes() {
        for (const spike of state.fallingSpikes) {
            ctx.beginPath();
            ctx.moveTo(spike.x - 12, spike.y);
            ctx.lineTo(spike.x + 12, spike.y);
            ctx.lineTo(spike.x, spike.y + 28);
            ctx.closePath();

            const grad = ctx.createLinearGradient(spike.x, spike.y, spike.x, spike.y + 28);
            grad.addColorStop(0, '#334155');
            grad.addColorStop(0.7, '#f59e0b');
            grad.addColorStop(1, '#fff');

            ctx.fillStyle = grad;
            ctx.fill();
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }

    function drawGems() {
        const time = Date.now() * 0.003;
        for (const gem of state.gemsList) {
            gem.rot += 0.03;
            const floatY = gem.y + Math.sin(time + gem.x) * 4;

            ctx.save();
            ctx.translate(gem.x, floatY);
            ctx.rotate(gem.rot);

            ctx.fillStyle = '#38bdf8';
            ctx.shadowColor = '#00f2fe';
            ctx.shadowBlur = 12;

            // Rhombus Diamond
            ctx.beginPath();
            ctx.moveTo(0, -gem.radius);
            ctx.lineTo(gem.radius * 0.8, 0);
            ctx.lineTo(0, gem.radius);
            ctx.lineTo(-gem.radius * 0.8, 0);
            ctx.closePath();
            ctx.fill();

            // White facet highlight
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(0, -gem.radius * 0.6);
            ctx.lineTo(gem.radius * 0.3, 0);
            ctx.lineTo(0, gem.radius * 0.3);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }
    }

    function drawBall(ball) {
        if (!ball.alive) return;

        // Trail
        if (ball.trail.length > 1) {
            for (let i = 0; i < ball.trail.length - 1; i++) {
                const alpha = (1 - i / ball.trail.length) * 0.45;
                ctx.beginPath();
                ctx.moveTo(ball.trail[i].x, ball.trail[i].y);
                ctx.lineTo(ball.trail[i + 1].x, ball.trail[i + 1].y);
                ctx.strokeStyle = ball.color;
                ctx.globalAlpha = alpha;
                ctx.lineWidth = (ball.radius * 1.5) * (1 - i / ball.trail.length);
                ctx.stroke();
            }
            ctx.globalAlpha = 1.0;
        }

        ctx.save();
        ctx.translate(ball.x, ball.y);
        ctx.scale(ball.scaleX, ball.scaleY);

        // Outer Glow
        ctx.shadowColor = ball.color;
        ctx.shadowBlur = 16;

        // Ball Body gradient
        const r = ball.radius;
        const grad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);

        if (state.skin === 'fire') {
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.4, '#f59e0b');
            grad.addColorStop(1, '#ef4444');
        } else if (state.skin === 'gold') {
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.5, '#fbbf24');
            grad.addColorStop(1, '#d97706');
        } else if (state.skin === 'candy') {
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.5, '#f43f5e');
            grad.addColorStop(1, '#9f1239');
        } else {
            // Neon Cyan / Default
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.4, ball.color);
            grad.addColorStop(1, '#0284c7');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Eye / Face expression (Cute & dynamic)
        ctx.fillStyle = '#070a13';
        const lookDir = ball.vx > 0 ? 3 : -3;
        ctx.beginPath();
        ctx.arc(-4 + lookDir, -3, 2.5, 0, Math.PI * 2);
        ctx.arc(4 + lookDir, -3, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Glint highlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-r * 0.3, -r * 0.3, r * 0.28, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    function drawShockwaves() {
        for (const sw of state.shockwaves) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            ctx.strokeStyle = sw.color;
            ctx.lineWidth = 4 * sw.life;
            ctx.globalAlpha = sw.life;
            ctx.stroke();
            ctx.restore();
        }
    }

    function drawShards() {
        for (const s of state.shards) {
            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.rotate(s.rot);
            ctx.fillStyle = s.color;
            ctx.globalAlpha = s.life;

            // Sharp triangular fragment
            ctx.beginPath();
            ctx.moveTo(0, -s.size);
            ctx.lineTo(s.size * 0.6, s.size * 0.7);
            ctx.lineTo(-s.size * 0.6, s.size * 0.7);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }
    }

    function drawSparkles() {
        for (const sp of state.sparkles) {
            ctx.save();
            ctx.fillStyle = sp.color;
            ctx.globalAlpha = sp.life;
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // =========================================================================
    // 10. GAME LOOP & HUD UPDATES
    // =========================================================================
    function updateHud() {
        currentScoreEl.textContent = state.score;
        highScoreValEl.textContent = state.highScore;
        gemCountEl.textContent = state.gems;
        multiplierTextEl.textContent = `COMBO x${state.multiplier}`;

        if (state.mode === 'pvp') {
            p2ScoreEl.textContent = state.score;
            p2WinsValEl.textContent = state.p2Wins;
        }
    }

    function resetGame() {
        state.score = 0;
        state.multiplier = 1;
        state.isGameOver = false;
        state.isPlaying = false;
        state.shards = [];
        state.shockwaves = [];
        state.sparkles = [];
        state.fallingSpikes = [];
        state.gemsList = [];

        initBoundarySpikes();
        initBalls();

        // Initial wall spikes (sprout on right wall)
        state.wallSpikesLeft = [];
        state.wallSpikesRight = generateWallSpikes('right');

        updateHud();

        // UI Reset
        startPrompt.classList.remove('hidden');
        gameOverModal.classList.remove('active');
        blastOverlay.classList.remove('active');
    }

    function startGame() {
        if (state.isPlaying) return;
        state.isPlaying = true;
        startPrompt.classList.add('hidden');
        sound.resume();
    }

    let lastFrameTime = performance.now();
    function gameLoop(now) {
        updateGame();
        render();
        requestAnimationFrame(gameLoop);
    }

    // =========================================================================
    // 11. INPUT LISTENERS
    // =========================================================================
    function handleP1Jump() {
        if (!state.isPlaying && !state.isGameOver) {
            startGame();
        }
        if (state.isPlaying) {
            const ball = state.balls.find(b => b.controls === 'p1');
            if (ball) bounceBall(ball);
        }
    }

    function handleP2Jump() {
        if (!state.isPlaying && !state.isGameOver) {
            startGame();
        }
        if (state.isPlaying) {
            const ball = state.balls.find(b => b.controls === 'p2');
            if (ball) bounceBall(ball);
        }
    }

    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'KeyW') {
            handleP1Jump();
            e.preventDefault();
        }
        if (e.code === 'ArrowUp' || e.code === 'Enter') {
            if (state.mode === 'pvp') {
                handleP2Jump();
            } else {
                handleP1Jump();
            }
            e.preventDefault();
        }
    });

    // Canvas click / touch
    canvas.addEventListener('pointerdown', (e) => {
        handleP1Jump();
    });

    btnPlayAgain.addEventListener('click', () => {
        resetGame();
        startGame();
        handleP1Jump();
    });

    btnRestartTop.addEventListener('click', resetGame);

    btnSound.addEventListener('click', () => {
        sound.enabled = !sound.enabled;
        soundIcon.textContent = sound.enabled ? '🔊' : '🔇';
    });

    btnRules.addEventListener('click', () => {
        rulesModal.classList.add('active');
    });
    btnCloseRules.addEventListener('click', () => {
        rulesModal.classList.remove('active');
    });
    btnGotRules.addEventListener('click', () => {
        rulesModal.classList.remove('active');
    });

    modeSelect.addEventListener('change', (e) => {
        state.mode = e.target.value;
        if (state.mode === 'pvp') {
            p2HudCard.style.display = 'block';
            soloLegend.style.display = 'none';
            pvpLegend.style.display = 'flex';
            p1HudLabel.textContent = 'P1 SCORE';
        } else {
            p2HudCard.style.display = 'none';
            soloLegend.style.display = 'flex';
            pvpLegend.style.display = 'none';
            p1HudLabel.textContent = 'SCORE';
        }
        resetGame();
    });

    skinSelect.addEventListener('change', (e) => {
        state.skin = e.target.value;
    });

    diffSelect.addEventListener('change', (e) => {
        state.difficulty = e.target.value;
        resetGame();
    });

    // Start
    resetGame();
    requestAnimationFrame(gameLoop);

})();
