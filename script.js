// Session flag - no redirect, just mark as started
sessionStorage.setItem('am_game_started', 'true');

// PRNG for Campaign Map
function mulberry32(a) {
    return function () {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}
let currentSeed = null;
let prng = Math.random;
let campaignLevel = null;

const STATE = {
    board: [],
    solution: [],
    initialBoard: [],
    notes: [],
    history: [],
    mistakes: 0,
    time: 0,
    timerInterval: null,
    selectedCell: null,
    isNotesMode: false,
    difficulty: 'easy',
    mode: 'classic',
    hintsLeft: 3,
    isPlaying: false,
    isPaused: false,
    size: 9,
    boxSize: 3,
    cages: [],
    mistakeLimit: 3
};

const SETTINGS = {
    theme: 'dark',
    sound: true,
    volume: 0.5,
    autoComplete: true,
    highlightRegion: true,
    mistakeLimit: 3
};

const STATS = {
    totalGames: 0,
    totalWins: 0,
    bestStreak: 0,
    currentStreak: 0,
    lastStreakDate: null,
    fastestTime: null,
    totalTime: 0,
    totalMistakes: 0,
    hintsUsed: 0,
    dailyChallenges: 0,
    modes: { classic:0, cross:0, killer:0, math:0, square:0, alphabet:0 },
    xp: 0,
    rank: 'Bronze',
    achievements: [],
    unlockedThemes: ['dark', 'light', 'neon', 'galaxy', 'royal'],
    level: 1
};

const RANKS = [
    { name: 'Bronze', min: 0, icon: '🥉' },
    { name: 'Silver', min: 1000, icon: '🥈' },
    { name: 'Gold', min: 2500, icon: '🥇' },
    { name: 'Platinum', min: 5000, icon: '💎' },
    { name: 'Diamond', min: 10000, icon: '🛡️' },
    { name: 'Master', min: 25000, icon: '👑' }
];

const XP_REWARDS = {
    WIN: 100,
    NO_MISTAKE: 50,
    FAST_SOLVE: 50, // Under 5 mins
    DAILY_BONUS: 100
};

const ACHIEVEMENTS = [
    { id: 'first_win', name: 'First Victory', desc: 'Win your first Sudoku puzzle', icon: '🏆' },
    { id: 'win_10', name: 'Rising Star', desc: 'Win 10 Sudoku puzzles', icon: '⭐' },
    { id: 'no_mistake', name: 'Perfectionist', desc: 'Win a game with zero mistakes', icon: '🎯' },
    { id: 'streak_7', name: 'Week Warrior', desc: 'Maintain a 7-day streak', icon: '🔥' },
    { id: 'level_50', name: 'Half Century', desc: 'Complete 50 levels', icon: '🏅' },
    { id: 'killer_master', name: 'Killer Master', desc: 'Win a Killer Sudoku game', icon: '🗡️' },
    { id: 'cross_master', name: 'Cross Master', desc: 'Win a Cross Sudoku game', icon: '⚔️' },
    { id: 'math_master', name: 'Math Master', desc: 'Win a Math Sudoku game', icon: '➗' },
    { id: 'speed_runner', name: 'Speed Runner', desc: 'Solve a puzzle in under 3 minutes', icon: '⚡' }
];

const DIFFICULTIES = {
    easy: { remove: 30, hints: 5 },
    medium: { remove: 42, hints: 3 },
    hard: { remove: 53, hints: 2 },
    extreme: { remove: 60, hints: 1 }
};

let elements = {};

function setupElements() {
    elements = {
        board: document.getElementById('sudoku-board'),
        diffPills: document.querySelectorAll('.diff-pill'),
        mistakes: document.getElementById('mistakes-display'),
        hints: document.getElementById('hints-display'),
        timer: document.getElementById('timer-display'),
        timerWrap: document.getElementById('timer-wrap'),
        pauseBtn: document.getElementById('pause-btn'),
        resumeBtn: document.getElementById('resume-btn'),
        themeBtn: document.getElementById('theme-toggle'),
        pauseOverlay: document.getElementById('pause-overlay'),
        loadingOverlay: document.getElementById('loading-overlay'),
        victoryModal: document.getElementById('victory-modal'),
        gameOverModal: document.getElementById('game-over-modal'),
        btnUndo: document.getElementById('btn-undo'),
        btnErase: document.getElementById('btn-erase'),
        btnNotes: document.getElementById('btn-notes'),
        btnHint: document.getElementById('btn-hint'),
        notesBadge: document.getElementById('notes-badge'),
        numpad: document.querySelectorAll('.num-btn'),
        vicNewGame: document.getElementById('vic-new-game-btn'),
        goNewGame: document.getElementById('go-new-game-btn'),
        vicNextLevel: document.getElementById('vic-next-level-btn'),
        vicStars: document.getElementById('vic-stars'),
        vicSub: document.getElementById('vic-sub'),
        btnBackMap: document.getElementById('btn-back-map'),
        levelBadge: document.getElementById('level-badge'),
        levelDisplay: document.getElementById('level-display'),
        diffSelector: document.querySelector('.difficulty-group'),
        authModal: document.getElementById('auth-modal'),
        btnAuthLogin: document.getElementById('btn-auth-login'),
        btnAuthSignup: document.getElementById('btn-auth-signup'),
        btnAuthGuest: document.getElementById('btn-auth-guest'),
        modeTabs: document.querySelectorAll('.mode-tab'),
        levelGrid: document.getElementById('level-grid'),
        lvlSelectView: document.getElementById('level-selection-view'),
        gameView: document.getElementById('game-view'),
        btnStartGame: document.getElementById('btn-start-game'),
        btnOpenSettings: document.getElementById('btn-open-settings-hub'),
        btnHome: document.getElementById('btn-home'),
        settingsModal: document.getElementById('settings-modal'),
        btnCloseSettings: document.getElementById('btn-close-settings'),
        themeOpts: document.querySelectorAll('.theme-opt'),
        toggleSound: document.getElementById('toggle-sound'),
        volumeSlider: document.getElementById('volume-slider'),
        toggleAuto: document.getElementById('toggle-auto'),
        toggleHighlight: document.getElementById('toggle-highlight'),
        multiOpts: document.querySelectorAll('.multi-opt'),
        howToModal: document.getElementById('how-to-modal'),
        btnHowTo: document.getElementById('btn-how-to'),
        btnCloseHowTo: document.getElementById('btn-close-how-to'),
        btnRestartLvl: document.getElementById('btn-restart-lvl'),
        btnExitLvl: document.getElementById('btn-exit-lvl'),
        progStats: document.getElementById('progression-stats'),
        goSub: document.getElementById('go-sub'),
        statsModal: document.getElementById('stats-modal'),
        btnOpenStats: document.getElementById('btn-open-stats'),
        btnOpenStatsHub: document.getElementById('btn-stats'),
        btnOpenStatsNav: document.getElementById('btn-open-stats-nav'),
        btnCloseStats: document.getElementById('btn-close-stats'),
        howToTabs: document.querySelectorAll('.how-to-tab'),
        howToText: document.getElementById('how-to-text'),
        btnCloseHowToBottom: document.getElementById('btn-close-how-to-bottom'),
        xpProgressNav: document.getElementById('xp-progress-nav'),
        rankIconNav: document.getElementById('rank-icon-nav'),
        rankNameNav: document.getElementById('rank-name-nav'),
        achievementsModal: document.getElementById('achievements-modal'),
        achievementsGrid: document.getElementById('achievements-grid'),
        btnOpenAchievements: document.getElementById('btn-achievements'),
        btnCloseAchievements: document.getElementById('btn-close-achievements'),
        resumeBanner: document.getElementById('resume-banner'),
        resumeInfo: document.getElementById('resume-info'),
        btnResumeGame: document.getElementById('btn-resume-game'),
        vicXPProgress: document.getElementById('vic-xp-progress'),
        vicXPGain: document.getElementById('vic-xp-gain'),
        vicRankCurrent: document.getElementById('vic-rank-current'),
        vicStreakCount: document.getElementById('vic-streak-count'),
        statV2Wins: document.getElementById('stat-v2-total-wins'),
        statV2WinRate: document.getElementById('stat-v2-win-rate'),
        statV2BestStreak: document.getElementById('stat-v2-best-streak'),
        statV2AvgTime: document.getElementById('stat-v2-avg-time'),
        statAchievementsCount: document.getElementById('stat-achievements-count'),
        statAchievementsProgress: document.getElementById('stat-achievements-progress'),
        statTimeChart: document.getElementById('stat-time-chart'),
        btnPlayDaily: document.getElementById('btn-play-daily'),
        dailyStreakVal: document.getElementById('daily-streak-val'),
        dailyStatus: document.getElementById('daily-status'),
        dailyBanner: document.getElementById('daily-challenge-banner'),
        vicAchievementWrap: document.getElementById('vic-achievement-unlocked'),
        vicAchievementIcon: document.getElementById('vic-achievement-icon'),
        vicAchievementName: document.getElementById('vic-achievement-name')
    };
}

class SudokuLogic {
    static isValid(board, r, c, n, mode, cages) {
        let size = mode === 'square' ? 4 : 9;
        let boxSize = mode === 'square' ? 2 : 3;

        for (let i = 0; i < size; i++) {
            if (board[r * size + i] === n && i !== c) return false;
            if (board[i * size + c] === n && i !== r) return false;
        }
        let br = Math.floor(r / boxSize) * boxSize, bc = Math.floor(c / boxSize) * boxSize;
        for (let i = 0; i < boxSize; i++) {
            for (let j = 0; j < boxSize; j++) {
                let cell = (br + i) * size + (bc + j);
                if (board[cell] === n && (br + i !== r || bc + j !== c)) return false;
            }
        }
        if (mode === 'cross') {
            if (r === c) {
                for (let i = 0; i < size; i++) {
                    if (board[i * size + i] === n && i !== r) return false;
                }
            }
            if (r + c === size - 1) {
                for (let i = 0; i < size; i++) {
                    if (board[i * size + (size - 1 - i)] === n && i !== r) return false;
                }
            }
        }
        if ((mode === 'killer' || mode === 'math') && cages) {
            let cell = r * size + c;
            let cage = cages.find(cg => cg.cells.includes(cell));
            if (cage) {
                for (let cc of cage.cells) {
                    if (cc !== cell && board[cc] === n) return false;
                }
                let isComplete = true;
                let vals = [];
                for (let cc of cage.cells) {
                    if (cc === cell) vals.push(n);
                    else if (board[cc] === 0) { isComplete = false; break; }
                    else vals.push(board[cc]);
                }
                if (isComplete) {
                    if (mode === 'killer') {
                        let sum = vals.reduce((a, b) => a + b, 0);
                        if (sum !== cage.target) return false;
                    } else if (mode === 'math') {
                        if (cage.op === '+') {
                            if (vals.reduce((a, b) => a + b, 0) !== cage.target) return false;
                        } else if (cage.op === '×') {
                            if (vals.reduce((a, b) => a * b, 1) !== cage.target) return false;
                        } else if (cage.op === '-') {
                            if (vals.length === 2 && Math.abs(vals[0] - vals[1]) !== cage.target) return false;
                        } else if (cage.op === '÷') {
                            if (vals.length === 2 && vals[0] / vals[1] !== cage.target && vals[1] / vals[0] !== cage.target) return false;
                        } else if (cage.op === '') {
                            if (vals[0] !== cage.target) return false;
                        }
                    }
                } else if (mode === 'killer') {
                    if (vals.reduce((a, b) => a + b, 0) >= cage.target) return false;
                }
            }
        }
        return true;
    }

    static solve(board, limit = 0, mode = 'classic', cages = null) {
        let size = mode === 'square' ? 4 : 9;
        let solutions = 0;
        let finalBoard = null;
        const helper = (b) => {
            if (limit > 0 && solutions >= limit) return true;
            let empty = -1;
            for (let i = 0; i < size * size; i++) if (b[i] === 0) { empty = i; break; }
            if (empty === -1) { solutions++; finalBoard = [...b]; return true; }
            let r = Math.floor(empty / size), c = empty % size;
            for (let n = 1; n <= size; n++) {
                if (this.isValid(b, r, c, n, mode, cages)) {
                    b[empty] = n;
                    helper(b);
                    if (limit > 0 && solutions >= limit) return true;
                    b[empty] = 0;
                }
            }
            return false;
        };
        helper(board);
        return { solutions, board: finalBoard };
    }

    static generateComplete(mode) {
        let size = mode === 'square' ? 4 : 9;
        let b = new Array(size * size).fill(0);
        const fill = () => {
            let empty = -1;
            for (let i = 0; i < size * size; i++) if (b[i] === 0) { empty = i; break; }
            if (empty === -1) return true;
            let nums = Array.from({length: size}, (_, i) => i + 1).sort(() => prng() - 0.5);
            let r = Math.floor(empty / size), c = empty % size;
            for (let n of nums) {
                if (this.isValid(b, r, c, n, mode, null)) {
                    b[empty] = n;
                    if (fill()) return true;
                    b[empty] = 0;
                }
            }
            return false;
        };
        if (mode !== 'cross' && mode !== 'square') {
            for (let i = 0; i < size; i += 3) {
                let nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => prng() - 0.5);
                let idx = 0;
                for (let r = 0; r < 3; r++) {
                    for (let c = 0; c < 3; c++) {
                        b[(i + r) * size + (i + c)] = nums[idx++];
                    }
                }
            }
        }
        fill();
        return b;
    }

    static generateCages(solution, mode) {
        let size = mode === 'square' ? 4 : 9;
        let cages = [];
        let unassigned = new Set(Array.from({length: size * size}, (_, i) => i));
        let cageId = 0;
        
        while (unassigned.size > 0) {
            let startCell = Array.from(unassigned)[Math.floor(prng() * unassigned.size)];
            let currentCage = [startCell];
            unassigned.delete(startCell);
            
            let targetSize = Math.floor(prng() * 3) + 2; // 2 to 4
            
            while (currentCage.length < targetSize) {
                let neighbors = [];
                for (let cell of currentCage) {
                    let r = Math.floor(cell / size), c = cell % size;
                    let dirs = [[-1,0],[1,0],[0,-1],[0,1]];
                    for (let [dr, dc] of dirs) {
                        let nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
                            let ncell = nr * size + nc;
                            if (unassigned.has(ncell)) {
                                let digit = solution[ncell];
                                let hasDigit = currentCage.some(c => solution[c] === digit);
                                if (!hasDigit) neighbors.push(ncell);
                            }
                        }
                    }
                }
                if (neighbors.length === 0) break;
                let nextCell = neighbors[Math.floor(prng() * neighbors.length)];
                currentCage.push(nextCell);
                unassigned.delete(nextCell);
            }
            
            let target = 0, op = '';
            let vals = currentCage.map(c => solution[c]);
            
            if (mode === 'killer') {
                target = vals.reduce((sum, c) => sum + c, 0);
            } else if (mode === 'math') {
                if (currentCage.length === 1) {
                    target = vals[0]; op = '';
                } else if (currentCage.length === 2) {
                    if (vals[0] % vals[1] === 0) { target = vals[0] / vals[1]; op = '÷'; }
                    else if (vals[1] % vals[0] === 0) { target = vals[1] / vals[0]; op = '÷'; }
                    else if (vals[0] > vals[1]) { target = vals[0] - vals[1]; op = '-'; }
                    else if (vals[1] > vals[0]) { target = vals[1] - vals[0]; op = '-'; }
                    else {
                        if (prng() > 0.5) { target = vals[0] * vals[1]; op = '×'; }
                        else { target = vals[0] + vals[1]; op = '+'; }
                    }
                } else {
                    if (prng() > 0.5) { target = vals.reduce((a, b) => a * b, 1); op = '×'; }
                    else { target = vals.reduce((a, b) => a + b, 0); op = '+'; }
                }
            }
            cages.push({ id: cageId++, cells: currentCage, target: target, op: op });
        }
        return cages;
    }

    static async generatePuzzle(mode, diff) {
        return new Promise(res => {
            setTimeout(() => {
                let size = mode === 'square' ? 4 : 9;
                let solution = this.generateComplete(mode);
                let cages = (mode === 'killer' || mode === 'math') ? this.generateCages(solution, mode) : null;
                
                let b = [...solution];
                let cells = Array.from({ length: size * size }, (_, i) => i).sort(() => prng() - 0.5);
                
                let target = DIFFICULTIES[diff].remove;
                if (mode === 'square') {
                    target = {easy: 6, medium: 8, hard: 10, extreme: 12}[diff];
                }
                
                if (mode === 'killer' || mode === 'math') {
                    target = {easy: 50, medium: 65, hard: 81, extreme: 81}[diff];
                }

                let removed = 0;
                for (let i of cells) {
                    if (removed >= target) break;
                    let temp = b[i];
                    b[i] = 0;
                    if (this.solve([...b], 2, mode, cages).solutions !== 1) {
                        b[i] = temp;
                    } else {
                        removed++;
                    }
                }
                res({ puzzle: b, solution, cages });
            }, 50);
        });
    }
}

// Alphabet Mapping
const ALPHABET = " ABCDEFGHI"; // 1-indexed for convenience
function toVal(n) {
    if (STATE.mode === 'alphabet' && n > 0 && n <= 9) return ALPHABET[n];
    return n;
}

// Sound Engine
const SoundEngine = {
    audioCtx: null,
    bgMusic: null,
    
    init() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },

    play(type) {
        if (!SETTINGS.sound) return;
        if (type === 'click' && !SETTINGS.clickSound) return;
        if (type === 'win' && !SETTINGS.winSound) return;
        
        this.init();
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        
        let vol = SETTINGS.volume;
        
        if (type === 'click') {
            osc.frequency.setValueAtTime(440, this.audioCtx.currentTime);
            gain.gain.setValueAtTime(0.1 * vol, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01 * vol, this.audioCtx.currentTime + 0.1);
            osc.start(); osc.stop(this.audioCtx.currentTime + 0.1);
        } else if (type === 'error') {
            osc.frequency.setValueAtTime(150, this.audioCtx.currentTime);
            gain.gain.setValueAtTime(0.2 * vol, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01 * vol, this.audioCtx.currentTime + 0.3);
            osc.start(); osc.stop(this.audioCtx.currentTime + 0.3);
        } else if (type === 'win') {
            osc.frequency.setValueAtTime(523.25, this.audioCtx.currentTime); // C5
            gain.gain.setValueAtTime(0.1 * vol, this.audioCtx.currentTime);
            osc.start(); osc.stop(this.audioCtx.currentTime + 0.5);
        }
    },

    toggleMusic() {
        if (SETTINGS.music) {
            this.startMusic();
        } else {
            this.stopMusic();
        }
    },

    updateVolume() {
        // SFX volume is handled per play
    }
};

function applySettings() {
    // Theme — always safe
    document.documentElement.setAttribute('data-theme', SETTINGS.theme);
    localStorage.setItem('am_settings', JSON.stringify(SETTINGS));

    // Guard: only touch DOM elements if they have been set up
    if (!elements.themeOpts || !elements.themeOpts.length) return;

    elements.themeOpts.forEach(o => o.classList.toggle('active', o.dataset.t === SETTINGS.theme));
    if (elements.toggleSound) elements.toggleSound.classList.toggle('active', SETTINGS.sound);
    if (elements.volumeSlider) elements.volumeSlider.value = SETTINGS.volume;
    if (elements.toggleAuto) elements.toggleAuto.classList.toggle('active', SETTINGS.autoComplete);
    if (elements.toggleHighlight) elements.toggleHighlight.classList.toggle('active', SETTINGS.highlightRegion);
    if (elements.multiOpts) elements.multiOpts.forEach(o => o.classList.toggle('active', parseInt(o.dataset.limit) === SETTINGS.mistakeLimit));

    updateProgressionUI();
}

function updateProgressionUI() {
    ProgressionManager.checkRank();
    if (!elements.rankNameNav) return; // not mounted yet
    elements.rankNameNav.textContent = STATS.rank;
    elements.rankIconNav.textContent = ProgressionManager.getRankIcon(STATS.rank);
    
    // XP Bar (Level is every 1000 XP)
    let xpInLevel = STATS.xp % 1000;
    let pct = (xpInLevel / 1000) * 100;
    if (elements.xpProgressNav) elements.xpProgressNav.style.width = pct + '%';
}

function renderAchievements() {
    elements.achievementsGrid.innerHTML = '';
    ACHIEVEMENTS.forEach(a => {
        let unlocked = STATS.achievements.includes(a.id);
        let t = document.createElement('div');
        t.className = `achievement-tile ${unlocked ? 'unlocked' : ''}`;
        t.innerHTML = `
            <div class="achievement-icon">${a.icon}</div>
            <div class="achievement-name">${a.name}</div>
            <div class="achievement-desc">${a.desc}</div>
        `;
        elements.achievementsGrid.appendChild(t);
    });
}

function loadSettings() {
    let s = localStorage.getItem('am_settings');
    if (s) {
        try {
            Object.assign(SETTINGS, JSON.parse(s));
            applySettings();
        } catch(e) { console.error("Settings load failed", e); }
    }
}

function loadStats() {
    const saved = localStorage.getItem('am_stats');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            Object.assign(STATS, data);
        } catch(e) { console.error("Stats load failed", e); }
    }
}

function saveStats() {
    localStorage.setItem('am_stats', JSON.stringify(STATS));
}

function updateStats(win, time, mode, daily = false) {
    STATS.totalGames++;
    if (win) {
        STATS.totalWins++;
        if (STATS.fastestTime === null || time < STATS.fastestTime) STATS.fastestTime = time;
        STATS.totalTime += time;
        if (daily) {
            STATS.dailyChallenges++;
            STATS.lastDailyCompleted = new Date().toISOString().slice(0, 10);
        }
        STATS.modes[mode] = (STATS.modes[mode] || 0) + 1;
    }
    STATS.totalMistakes += STATE.mistakes;
    saveStats();
}

function renderStats() {
    if (STATS.totalGames === 0) {
        elements.statsModal.querySelector('.modal-card').innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
                <h2 class="modal-title" style="margin:0;">Statistics</h2>
                <button id="btn-close-stats-empty" class="icon-btn"><i class="fas fa-times"></i></button>
            </div>
            <div style="padding:40px 20px; text-align:center; color:var(--txt-dim);">
                <i class="fas fa-chart-pie" style="font-size:3rem; margin-bottom:15px; opacity:0.3;"></i>
                <p>Play games to generate statistics.</p>
            </div>
        `;
        document.getElementById('btn-close-stats-empty').onclick = () => elements.statsModal.classList.add('hidden');
        return;
    }

    const wr = Math.round((STATS.totalWins / STATS.totalGames) * 100);
    const avg = STATS.totalWins > 0 ? Math.floor(STATS.totalTime / STATS.totalWins) : 0;
    
    // Calculate Levels Completed
    const progress = JSON.parse(localStorage.getItem('am_grid_progress') || '{}');
    let completedLevels = 0;
    Object.values(progress).forEach(m => Object.values(m).forEach(d => Object.values(d.levels || {}).forEach(l => { if(l.completed) completedLevels++; })));

    // Favorite Mode
    let favorite = 'None';
    let maxWins = -1;
    for (let [mode, wins] of Object.entries(STATS.modes)) {
        if (wins > maxWins) {
            maxWins = wins;
            favorite = mode.charAt(0).toUpperCase() + mode.slice(1);
        }
    }

    elements.statsModal.querySelector('.modal-card').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
            <h2 class="modal-title" style="margin:0;">Statistics</h2>
            <button id="btn-close-stats-v3" class="icon-btn"><i class="fas fa-times"></i></button>
        </div>
        <div class="stats-grid-v3" style="display:grid; grid-template-columns: repeat(2, 1fr); gap: 10px; text-align: left;">
            <div class="stat-v3-card"><span>Total Games</span><strong>${STATS.totalGames}</strong></div>
            <div class="stat-v3-card"><span>Total Wins</span><strong>${STATS.totalWins}</strong></div>
            <div class="stat-v3-card"><span>Win Rate</span><strong>${wr}%</strong></div>
            <div class="stat-v3-card"><span>Fastest Time</span><strong>${STATS.fastestTime ? formatTime(STATS.fastestTime) : '-'}</strong></div>
            <div class="stat-v3-card"><span>Average Time</span><strong>${avg > 0 ? formatTime(avg) : '-'}</strong></div>
            <div class="stat-v3-card"><span>Current Streak</span><strong>${STATS.currentStreak}</strong></div>
            <div class="stat-v3-card"><span>Best Streak</span><strong>${STATS.bestStreak}</strong></div>
            <div class="stat-v3-card"><span>Levels Done</span><strong>${completedLevels}</strong></div>
            <div class="stat-v3-card"><span>Favorite Mode</span><strong>${favorite}</strong></div>
            <div class="stat-v3-card"><span>Total Mistakes</span><strong>${STATS.totalMistakes}</strong></div>
            <div class="stat-v3-card"><span>Hints Used</span><strong>${STATS.hintsUsed}</strong></div>
        </div>
    `;
    document.getElementById('btn-close-stats-v3').onclick = () => elements.statsModal.classList.add('hidden');
}

function formatTime(s) {
    let m = Math.floor(s / 60);
    let sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

// --- NEW PREMIUM SYSTEMS ---

const ProgressionManager = {
    addXP(amount) {
        STATS.xp += amount;
        this.checkRank();
        saveStats();
    },
    checkRank() {
        let currentRank = RANKS[0];
        for (let r of RANKS) {
            if (STATS.xp >= r.min) currentRank = r;
        }
        if (STATS.rank !== currentRank.name) {
            STATS.rank = currentRank.name;
            // Trigger rank up notification later
        }
        STATS.level = Math.floor(STATS.xp / 1000) + 1;
    },
    getRankIcon(name) {
        return RANKS.find(r => r.name === name)?.icon || '🥉';
    }
};

const StreakManager = {
    init() {
        if (!STATS.lastStreakDate) return;
        
        let last = new Date(STATS.lastStreakDate);
        let today = new Date();
        
        // Reset time to midnight for day comparison
        last.setHours(0,0,0,0);
        today.setHours(0,0,0,0);
        
        let diff = (today - last) / (1000 * 60 * 60 * 24);
        
        if (diff > 1) {
            // Missed more than a day
            STATS.currentStreak = 0;
            saveStats();
        }
    },
    recordWin() {
        let last = STATS.lastStreakDate ? new Date(STATS.lastStreakDate) : null;
        let today = new Date();
        
        if (last) {
            last.setHours(0,0,0,0);
            today.setHours(0,0,0,0);
            
            if (today > last) {
                STATS.currentStreak++;
                if (STATS.currentStreak > STATS.bestStreak) STATS.bestStreak = STATS.currentStreak;
                STATS.lastStreakDate = new Date().toISOString();
                this.checkMilestones();
            }
        } else {
            STATS.currentStreak = 1;
            STATS.bestStreak = Math.max(STATS.bestStreak, 1);
            STATS.lastStreakDate = new Date().toISOString();
        }
        saveStats();
    },
    checkMilestones() {
        const milestones = [3, 7, 14, 30];
        if (milestones.includes(STATS.currentStreak)) {
            // Trigger milestone reward
        }
    }
};

const AchievementManager = {
    unlock(id) {
        if (STATS.achievements.includes(id)) return;
        
        const achievement = ACHIEVEMENTS.find(a => a.id === id);
        if (achievement) {
            STATS.achievements.push(id);
            saveStats();
            this.notify(achievement);
        }
    },
    notify(achievement) {
        SoundEngine.play('win');
        const toast = document.createElement('div');
        toast.className = 'achievement-toast';
        toast.innerHTML = `
            <div class="toast-icon">${achievement.icon}</div>
            <div class="toast-info">
                <div class="toast-title">Achievement Unlocked!</div>
                <div class="toast-name">${achievement.name}</div>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    },
    check(trigger, data = {}) {
        if (trigger === 'win') {
            this.unlock('first_win');
            if (STATS.totalWins >= 10) this.unlock('win_10');
            if (data.mistakes === 0) this.unlock('no_mistake');
            if (data.time < 180) this.unlock('speed_runner');
            if (data.mode === 'killer') this.unlock('killer_master');
            if (data.mode === 'cross') this.unlock('cross_master');
            if (data.mode === 'math') this.unlock('math_master');
        }
        if (trigger === 'streak') {
            if (STATS.currentStreak >= 7) this.unlock('streak_7');
        }
        if (trigger === 'progress') {
            // Check levels completed
            let progress = JSON.parse(localStorage.getItem('am_grid_progress') || '{}');
            let completed = 0;
            Object.values(progress).forEach(m => Object.values(m).forEach(d => Object.values(d.levels || {}).forEach(l => { if(l.completed) completed++; })));
            if (completed >= 50) this.unlock('level_50');
        }
    }
};

const GameStateManager = {
    save() {
        if (!STATE.isPlaying) return;
        const saveData = {
            board: STATE.board,
            initialBoard: STATE.initialBoard,
            solution: STATE.solution,
            notes: STATE.notes.map(s => Array.from(s)),
            mistakes: STATE.mistakes,
            time: STATE.time,
            mode: STATE.mode,
            difficulty: STATE.difficulty,
            size: STATE.size,
            boxSize: STATE.boxSize,
            hintsLeft: STATE.hintsLeft,
            cages: STATE.cages
        };
        localStorage.setItem('am_saved_game', JSON.stringify(saveData));
    },
    clear() {
        localStorage.removeItem('am_saved_game');
    },
    load() {
        const saved = localStorage.getItem('am_saved_game');
        if (!saved) return null;
        try {
            const data = JSON.parse(saved);
            data.notes = data.notes.map(arr => new Set(arr));
            return data;
        } catch(e) { return null; }
    },
    checkResume() {
        const saved = this.load();
        if (saved) {
            elements.resumeInfo.textContent = `${saved.mode.charAt(0).toUpperCase() + saved.mode.slice(1)} • ${saved.difficulty.charAt(0).toUpperCase() + saved.difficulty.slice(1)} • ${formatTime(saved.time)}`;
            elements.resumeBanner.classList.remove('hidden');
        } else {
            elements.resumeBanner.classList.add('hidden');
        }
    }
};

const DailyChallengeManager = {
    getToday() { return new Date().toISOString().slice(0, 10); },
    checkStatus() {
        const today = this.getToday();
        elements.dailyStreakVal.textContent = STATS.currentStreak;
        if (STATS.lastDailyCompleted === today) {
            elements.dailyStatus.innerHTML = '<i class="fas fa-check-circle"></i> Completed Today';
            elements.btnPlayDaily.textContent = 'Replay';
            elements.dailyBanner.style.opacity = '0.8';
        } else {
            elements.dailyStatus.innerHTML = 'Available Now • <span id="daily-streak-val">' + STATS.currentStreak + '</span> Day Streak';
            elements.btnPlayDaily.textContent = 'Play';
            elements.dailyBanner.style.opacity = '1';
        }
    },
    launch() {
        const today = this.getToday();
        window.history.pushState({}, '', '?start=true&mode=daily&date=' + today);
        launchCampaignLevel(1); // Use level 1 as dummy, seed handles it
    }
};

// --- END NEW PREMIUM SYSTEMS ---

// UI Sync
function renderBoard() {
    elements.board.innerHTML = '';
    
    // Dynamic grid setup
    elements.board.style.gridTemplateColumns = `repeat(${STATE.size}, 1fr)`;
    elements.board.style.gridTemplateRows = `repeat(${STATE.size}, 1fr)`;
    
    let boxR = STATE.size / STATE.boxSize;
    for (let i = 0; i < STATE.size * STATE.size; i++) {
        let cell = document.createElement('div');
        cell.className = 'cell';
        
        let r = Math.floor(i / STATE.size), c = i % STATE.size;
        if ((c + 1) % STATE.boxSize === 0 && c !== STATE.size - 1) cell.classList.add('box-border-right');
        if ((r + 1) % boxR === 0 && r !== STATE.size - 1) cell.classList.add('box-border-bottom');
        
        if (STATE.mode === 'cross') {
            if (r === c || r + c === STATE.size - 1) {
                cell.classList.add('diagonal');
            }
        }
        
        if ((STATE.mode === 'killer' || STATE.mode === 'math') && STATE.cages) {
            let cage = STATE.cages.find(cg => cg.cells.includes(i));
            if (cage) {
                // Apply cage dashed borders only on sides NOT covered by a box-border class
                // The !important on .box-border-right/.box-border-bottom ensures box lines
                // aren't overridden. Cage borders use inline style for the remaining sides.
                const hasBoxRight  = cell.classList.contains('box-border-right');
                const hasBoxBottom = cell.classList.contains('box-border-bottom');

                if (!cage.cells.includes((r-1)*STATE.size + c))
                    cell.style.borderTop    = '2px dashed var(--accent-2)';
                if (!cage.cells.includes((r+1)*STATE.size + c) && !hasBoxBottom)
                    cell.style.borderBottom = '2px dashed var(--accent-2)';
                if (!cage.cells.includes(r*STATE.size + c - 1))
                    cell.style.borderLeft   = '2px dashed var(--accent-2)';
                if (!cage.cells.includes(r*STATE.size + c + 1) && !hasBoxRight)
                    cell.style.borderRight  = '2px dashed var(--accent-2)';

                let minCell = Math.min(...cage.cells);
                if (i === minCell) {
                    let label = document.createElement('span');
                    label.className = 'cage-label';
                    label.textContent = cage.target + cage.op;
                    cell.appendChild(label);
                }
            }
        }

        let val = STATE.board[i];
        if (val !== 0) {
            let valSpan = document.createElement('span');
            valSpan.className = 'cell-val';
            valSpan.textContent = toVal(val);
            cell.appendChild(valSpan);
            if (STATE.initialBoard[i] === 0) {
                cell.classList.add('user');
                if (val !== STATE.solution[i]) cell.classList.add('error');
            } else {
                cell.classList.add('given');
            }
        } else if (STATE.notes[i].size > 0) {
            let grid = document.createElement('div');
            grid.className = 'notes-grid';
            for (let n = 1; n <= STATE.size; n++) {
                let div = document.createElement('div');
                div.className = 'note';
                if (STATE.notes[i].has(n)) div.textContent = toVal(n);
                grid.appendChild(div);
            }
            cell.appendChild(grid);
        }
        cell.addEventListener('mousedown', () => {
            SoundEngine.play('click');
            selectCell(i);
        });
        elements.board.appendChild(cell);
    }
    updateHighlights();
    updateNumpadState();
}

function updateNumpadState() {
    let counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
    for (let i = 0; i < STATE.size * STATE.size; i++) {
        if (STATE.board[i] !== 0) {
            counts[STATE.board[i]]++;
        }
    }
    elements.numpad.forEach(btn => {
        let num = parseInt(btn.dataset.num);
        if (num > STATE.size) {
            btn.style.display = 'none';
        } else {
            btn.style.display = 'flex';
            if (counts[num] >= STATE.size) {
                btn.classList.add('depleted');
                btn.innerHTML = `<i class="fas fa-check" style="font-size:0.8rem; opacity:0.8;"></i>`;
            } else {
                btn.classList.remove('depleted');
                btn.innerHTML = toVal(num);
            }
        }
    });
}

function updateHighlights() {
    let cells = elements.board.children;
    for (let i = 0; i < STATE.size * STATE.size; i++) {
        cells[i].classList.remove('selected', 'related', 'same-num');
        if (SETTINGS.highlightRegion) {
             // We'll keep the related highlighting logic below
        } else {
            // If highlighting is off, don't add 'related'
        }
    }
    if (STATE.selectedCell === null) return;
    let s = STATE.selectedCell;
    let sr = Math.floor(s / STATE.size), sc = s % STATE.size;
    let sval = STATE.board[s];
    cells[s].classList.add('selected');
    let boxR = STATE.size / STATE.boxSize;
    for (let i = 0; i < STATE.size * STATE.size; i++) {
        if (i === s) continue;
        let r = Math.floor(i / STATE.size), c = i % STATE.size;
        
        if (SETTINGS.highlightRegion) {
            let inBox = (Math.floor(r / boxR) === Math.floor(sr / boxR) && Math.floor(c / STATE.boxSize) === Math.floor(sc / STATE.boxSize));
            let inDiag = false;
            if (STATE.mode === 'cross') {
                let inMain = (r === c && sr === sc);
                let inAnti = (r + c === STATE.size - 1 && sr + sc === STATE.size - 1);
                if (inMain || inAnti) inDiag = true;
            }

            if (r === sr || c === sc || inBox || inDiag) {
                cells[i].classList.add('related');
            }
        }
        
        if (sval !== 0 && STATE.board[i] === sval) {
            cells[i].classList.add('same-num');
        }
    }
}

function selectCell(i) {
    if (!STATE.isPlaying || STATE.isPaused) return;
    STATE.selectedCell = i;
    updateHighlights();
}

// Input Logic
function inputNumber(n) {
    if (n > STATE.size) return;
    if (!STATE.isPlaying || STATE.isPaused || STATE.selectedCell === null) return;
    let i = STATE.selectedCell;
    if (STATE.initialBoard[i] !== 0) return;
    if (STATE.board[i] !== 0 && STATE.board[i] === STATE.solution[i]) return;

    if (STATE.isNotesMode) {
        if (STATE.board[i] !== 0) return;
        saveHistory();
        if (STATE.notes[i].has(n)) STATE.notes[i].delete(n);
        else STATE.notes[i].add(n);
        renderBoard();
        return;
    }

    if (STATE.board[i] === n) return;
    saveHistory();
    STATE.board[i] = n;

    let r = Math.floor(i / STATE.size), c = i % STATE.size;
    let boxR = STATE.size / STATE.boxSize;
    for (let j = 0; j < STATE.size * STATE.size; j++) {
        let jr = Math.floor(j / STATE.size), jc = j % STATE.size;
        if (jr === r || jc === c || (Math.floor(jr / boxR) === Math.floor(r / boxR) && Math.floor(jc / STATE.boxSize) === Math.floor(c / STATE.boxSize))) {
            STATE.notes[j].delete(n);
        }
    }

    if (n !== STATE.solution[i]) {
        SoundEngine.play('error');
        STATE.mistakes++;
        let limit = SETTINGS.mistakeLimit === 0 ? "∞" : SETTINGS.mistakeLimit;
        elements.mistakes.textContent = `${STATE.mistakes}/${limit}`;
        elements.board.children[i].classList.add('shake');
        if (SETTINGS.mistakeLimit !== 0 && STATE.mistakes >= SETTINGS.mistakeLimit) {
            STATE.isPlaying = false;
            stopTimer();
            updateStats(false, STATE.time, STATE.mode, window.location.search.includes('mode=daily'));
            ProgressionManager.addXP(25); // Consolation XP
            
            // LEVEL 1 RETENTION PROMPT
            if (campaignLevel === 1) {
                elements.authModal.classList.remove('hidden');
                return; // Don't show regular game over
            }

            elements.goSub.textContent = `You made ${STATE.mistakes} mistakes.`;
            elements.gameOverModal.classList.remove('hidden');
        }
    }

    renderBoard();
    GameStateManager.save();
    if (SETTINGS.autoComplete) checkWin();
}

function createConfetti() {
    for (let i = 0; i < 50; i++) {
        let c = document.createElement('div');
        c.className = 'confetti';
        c.style.left = Math.random() * 100 + 'vw';
        c.style.backgroundColor = ['#7c3aed', '#06b6d4', '#fbbf24', '#ef4444', '#10b981'][Math.floor(Math.random() * 5)];
        c.style.width = Math.random() * 10 + 5 + 'px';
        c.style.height = c.style.width;
        c.style.animation = `confetti ${Math.random() * 2 + 1}s linear forwards`;
        c.style.animationDelay = Math.random() * 2 + 's';
        document.body.appendChild(c);
        setTimeout(() => c.remove(), 4000);
    }
}

function eraseCell() {
    if (!STATE.isPlaying || STATE.isPaused || STATE.selectedCell === null) return;
    let i = STATE.selectedCell;
    if (STATE.initialBoard[i] !== 0) return;
    if (STATE.board[i] !== 0 && STATE.board[i] === STATE.solution[i]) return;
    saveHistory();
    STATE.board[i] = 0;
    STATE.notes[i].clear();
    renderBoard();
    GameStateManager.save();
}

function toggleNotes() {
    STATE.isNotesMode = !STATE.isNotesMode;
    elements.notesBadge.textContent = STATE.isNotesMode ? 'ON' : 'OFF';
    elements.notesBadge.className = `mode-badge ${STATE.isNotesMode ? '' : 'off'}`;
}

function useHint() {
    if (!STATE.isPlaying || STATE.isPaused || STATE.hintsLeft <= 0 || STATE.selectedCell === null) return;
    let i = STATE.selectedCell;
    if (STATE.initialBoard[i] !== 0 || STATE.board[i] === STATE.solution[i]) return;
    saveHistory();
    STATE.board[i] = STATE.solution[i];
    STATE.hintsLeft--;
    STATS.hintsUsed++;
    saveStats();
    elements.hints.textContent = STATE.hintsLeft;
    
    let r = Math.floor(i / STATE.size), c = i % STATE.size;
    let boxR = STATE.size / STATE.boxSize;
    for (let j = 0; j < STATE.size * STATE.size; j++) {
        let jr = Math.floor(j / STATE.size), jc = j % STATE.size;
        if (jr === r || jc === c || (Math.floor(jr / boxR) === Math.floor(r / boxR) && Math.floor(jc / STATE.boxSize) === Math.floor(c / STATE.boxSize))) {
            STATE.notes[j].delete(STATE.solution[i]);
        }
    }
    
    renderBoard();
    elements.board.children[i].classList.add('hint-cell');
    STATS.totalHintsUsed++;
    GameStateManager.save();
    checkWin();
}

function saveHistory() {
    STATE.history.push({
        board: [...STATE.board],
        notes: STATE.notes.map(n => new Set(n))
    });
}

function undo() {
    if (!STATE.isPlaying || STATE.isPaused || STATE.history.length === 0) return;
    let h = STATE.history.pop();
    STATE.board = [...h.board];
    STATE.notes = h.notes.map(n => new Set(n));
    renderBoard();
    GameStateManager.save();
}

function formatTime(s) {
    let m = Math.floor(s / 60);
    let sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}
function startTimer() {
    STATE.timerInterval = setInterval(() => {
        if (!STATE.isPaused) {
            STATE.time++;
            elements.timer.textContent = formatTime(STATE.time);
        }
    }, 1000);
}
function stopTimer() { clearInterval(STATE.timerInterval); }

function togglePause() {
    if (!STATE.isPlaying) return;
    STATE.isPaused = !STATE.isPaused;
    elements.pauseOverlay.classList.toggle('hidden', !STATE.isPaused);
}

function checkWin() {
    for (let i = 0; i < STATE.size * STATE.size; i++) if (STATE.board[i] !== STATE.solution[i]) return;
    STATE.isPlaying = false;
    stopTimer();
    SoundEngine.play('win');
    createConfetti();

    let stars = 3;
    if (STATE.mistakes >= 1) stars = 2;
    if (STATE.mistakes >= 2) stars = 1;

    elements.vicStars.innerHTML = '';
    for (let i = 1; i <= 3; i++) {
        let fl = i <= stars ? 'filled' : '';
        elements.vicStars.innerHTML += `<i class="fas fa-star ${fl}" style="color: ${i <= stars ? '#fbbf24' : '#334155'};"></i>`;
    }

    if (campaignLevel !== null) {
        try {
            let saved = localStorage.getItem('am_grid_progress');
            let p = saved ? JSON.parse(saved) : {};
            if(!p[STATE.mode]) p[STATE.mode] = {};
            if(!p[STATE.mode][STATE.difficulty]) p[STATE.mode][STATE.difficulty] = { maxUnlocked: 1, levels: {} };
            
            let dp = p[STATE.mode][STATE.difficulty];
            dp.levels[campaignLevel] = { stars: stars, completed: true };
            
            if (campaignLevel >= dp.maxUnlocked && campaignLevel < 100) {
                dp.maxUnlocked = campaignLevel + 1;
            }
            localStorage.setItem('am_grid_progress', JSON.stringify(p));
        } catch (e) { }

        elements.vicNextLevel.classList.remove('hidden');
        elements.vicSub.textContent = `Level ${campaignLevel} Complete!`;
    } else {
        elements.vicSub.textContent = `Solved in ${formatTime(STATE.time)}`;
    }
    updateStats(true, STATE.time, STATE.mode, window.location.search.includes('mode=daily'));
    
    // XP & Achievements
    let xp = XP_REWARDS.WIN;
    if (STATE.mistakes === 0) xp += XP_REWARDS.NO_MISTAKE;
    if (STATE.time < 300) xp += XP_REWARDS.FAST_SOLVE;
    if (window.location.search.includes('mode=daily')) xp += XP_REWARDS.DAILY_BONUS;
    
    ProgressionManager.addXP(xp);
    StreakManager.recordWin();
    AchievementManager.check('win', { mistakes: STATE.mistakes, time: STATE.time, mode: STATE.mode });
    AchievementManager.check('progress');
    AchievementManager.check('streak');
    
    // UI Updates for Victory Modal
    elements.vicXPGain.textContent = `+${xp} XP`;
    elements.vicRankCurrent.textContent = STATS.rank;
    elements.vicStreakCount.textContent = STATS.currentStreak;
    
    // Animate XP Bar in modal
    let xpInLevel = (STATS.xp - xp) % 1000;
    let startPct = (xpInLevel / 1000) * 100;
    let endPct = ((STATS.xp % 1000) / 1000) * 100;
    if (STATS.xp % 1000 < (STATS.xp - xp) % 1000) endPct = 100; // Level up edge case simplified
    
    elements.vicXPProgress.style.width = startPct + '%';
    setTimeout(() => {
        elements.vicXPProgress.style.width = endPct + '%';
    }, 500);

    GameStateManager.clear();
    
    // RANDOM REWARDS
    if (Math.random() < 0.2) { // 20% chance
        const rewards = ['bonus_xp', 'theme_unlock'];
        const reward = rewards[Math.floor(Math.random() * rewards.length)];
        if (reward === 'bonus_xp') {
            ProgressionManager.addXP(50);
            elements.vicXPGain.textContent = `+${xp + 50} XP (Bonus!)`;
        } else if (reward === 'theme_unlock') {
            // New theme logic
        }
    }

    elements.victoryModal.classList.remove('hidden');
    
    // Check if any achievement was unlocked this win
    elements.vicAchievementWrap.classList.add('hidden');
    const recentAchievements = STATS.achievements.slice(-1); // Simplified check for "just now"
    if (recentAchievements.length > 0) {
        const ach = ACHIEVEMENTS.find(a => a.id === recentAchievements[0]);
        if (ach) {
            elements.vicAchievementIcon.textContent = ach.icon;
            elements.vicAchievementName.textContent = ach.name;
            elements.vicAchievementWrap.classList.remove('hidden');
        }
    }
}

// Init & Start
async function startNewGame() {
    elements.loadingOverlay.classList.remove('hidden');
    stopTimer();
    STATE.isPlaying = false;

    STATE.size = STATE.mode === 'square' ? 4 : 9;
    STATE.boxSize = STATE.mode === 'square' ? 2 : 3;

    let res = await SudokuLogic.generatePuzzle(STATE.mode, STATE.difficulty);
    STATE.board = res.puzzle;
    STATE.solution = res.solution;
    STATE.cages = res.cages || null;
    STATE.initialBoard = [...res.puzzle];
    STATE.notes = Array(STATE.size * STATE.size).fill(null).map(() => new Set());
    STATE.history = [];
    STATE.time = 0;
    STATE.mistakes = 0;
    STATE.selectedCell = null;
    STATE.isNotesMode = false;
    STATE.hintsLeft = DIFFICULTIES[STATE.difficulty].hints;
    STATE.isPaused = false;

    elements.mistakes.textContent = `0/${SETTINGS.mistakeLimit === 0 ? "∞" : SETTINGS.mistakeLimit}`;
    elements.hints.textContent = STATE.hintsLeft;
    elements.timer.textContent = '00:00';
    elements.notesBadge.textContent = 'OFF';
    elements.notesBadge.className = 'mode-badge off';

    elements.loadingOverlay.classList.add('hidden');
    elements.victoryModal.classList.add('hidden');
    elements.gameOverModal.classList.add('hidden');

    STATE.isPlaying = true;
    renderBoard();
    startTimer();
}

function toggleTheme() {
    let html = document.documentElement;
    let t = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', t);
    elements.themeBtn.innerHTML = t === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
}

function bindEvents() {
    // Mode Selection
    elements.modeTabs.forEach(t => {
        t.addEventListener('click', () => {
            SoundEngine.play('click');
            elements.modeTabs.forEach(x => x.classList.remove('active'));
            t.classList.add('active');
            STATE.mode = t.dataset.mode;
            renderLevelGrid();
            validateStartButton();
        });
    });

    // Difficulty Selection
    elements.diffPills.forEach(p => {
        p.addEventListener('click', () => {
            SoundEngine.play('click');
            elements.diffPills.forEach(x => x.classList.remove('active'));
            p.classList.add('active');
            STATE.difficulty = p.dataset.diff;
            validateStartButton();
        });
    });

    elements.pauseBtn.addEventListener('click', togglePause);
    elements.resumeBtn.addEventListener('click', togglePause);
    elements.themeBtn.addEventListener('click', toggleTheme);
    elements.btnUndo.addEventListener('click', undo);
    elements.btnHome.addEventListener('click', () => {
        SoundEngine.play('click');
        sessionStorage.removeItem('am_game_started');
        window.location.href = 'landing.html';
    });
    document.querySelectorAll('.btn-go-home').forEach(btn => {
        btn.addEventListener('click', () => {
            returnToLevelSelect();
        });
    });
    elements.btnErase.addEventListener('click', eraseCell);
    elements.btnNotes.addEventListener('click', toggleNotes);
    elements.btnHint.addEventListener('click', useHint);
    elements.numpad.forEach(b => {
        b.addEventListener('click', () => inputNumber(parseInt(b.dataset.num)));
    });
    window.addEventListener('keydown', e => {
        // Handle numeric input
        if (e.key >= '1' && e.key <= STATE.size.toString()) {
            inputNumber(parseInt(e.key));
        }
        // Handle Alphabet mode keyboard input
        else if (STATE.mode === 'alphabet') {
            const key = e.key.toLowerCase();
            const alphabetKeys = { 'a':1,'b':2,'c':3,'d':4,'e':5,'f':6,'g':7,'h':8,'i':9 };
            if (alphabetKeys[key]) {
                inputNumber(alphabetKeys[key]);
            }
        }
        
        if (e.key === 'Backspace' || e.key === 'Delete') eraseCell();
        else if (e.key.toLowerCase() === 'n') toggleNotes();
        else if (e.key.toLowerCase() === 'h') useHint();
        else if (e.key.toLowerCase() === 'u' || (e.ctrlKey && e.key === 'z')) undo();

        // Navigation arrows
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && STATE.selectedCell !== null) {
            e.preventDefault();
            let r = Math.floor(STATE.selectedCell / STATE.size), c = STATE.selectedCell % STATE.size;
            if (e.key === 'ArrowUp' && r > 0) selectCell((r - 1) * STATE.size + c);
            if (e.key === 'ArrowDown' && r < STATE.size - 1) selectCell((r + 1) * STATE.size + c);
            if (e.key === 'ArrowLeft' && c > 0) selectCell(r * STATE.size + c - 1);
            if (e.key === 'ArrowRight' && c < STATE.size - 1) selectCell(r * STATE.size + c + 1);
        }
    });

    // Game Over / Victory Buttons
    elements.vicNewGame.addEventListener('click', startNewGame);
    elements.goNewGame.addEventListener('click', startNewGame);
    elements.vicNextLevel.addEventListener('click', () => {
        campaignLevel++;
        elements.victoryModal.classList.add('hidden');
        launchCampaignLevel(campaignLevel);
    });

    elements.btnBackMap.addEventListener('click', () => {
        returnToLevelSelect();
    });

    if (elements.btnAuthGuest) {
        elements.btnAuthGuest.addEventListener('click', () => {
            SoundEngine.play('click');
            localStorage.setItem('am_user_session', 'guest');
            elements.authModal.classList.add('hidden');
            startNewGame();
        });
    }
    if (elements.btnAuthLogin) {
        elements.btnAuthLogin.addEventListener('click', () => {
            SoundEngine.play('click');
            localStorage.setItem('am_user_session', 'user');
            elements.authModal.classList.add('hidden');
            startNewGame(); // Placeholder
        });
    }
    if (elements.btnAuthSignup) {
        elements.btnAuthSignup.addEventListener('click', () => {
            SoundEngine.play('click');
            localStorage.setItem('am_user_session', 'user');
            elements.authModal.classList.add('hidden');
            startNewGame(); // Placeholder
        });
    }

    if (elements.btnStartGame) {
        elements.btnStartGame.addEventListener('click', () => {
            SoundEngine.play('click');
            launchCampaignLevel(selectedSetupLevel);
        });
    }

    // Settings Modal Events
    elements.btnOpenSettings.addEventListener('click', () => {
        SoundEngine.play('click');
        elements.settingsModal.classList.remove('hidden');
    });

    const openStats = () => {
        SoundEngine.play('click');
        renderStats();
        elements.statsModal.classList.remove('hidden');
    };
    if (elements.btnOpenStats) elements.btnOpenStats.addEventListener('click', openStats);
    if (elements.btnOpenStatsHub) elements.btnOpenStatsHub.addEventListener('click', openStats);
    if (elements.btnOpenStatsNav) elements.btnOpenStatsNav.addEventListener('click', openStats);
    if (elements.btnCloseStats) elements.btnCloseStats.addEventListener('click', () => {
        SoundEngine.play('click');
        elements.statsModal.classList.add('hidden');
    });

    elements.btnOpenAchievements.addEventListener('click', () => {
        SoundEngine.play('click');
        renderAchievements();
        elements.achievementsModal.classList.remove('hidden');
    });
    elements.btnCloseAchievements.addEventListener('click', () => {
        SoundEngine.play('click');
        elements.achievementsModal.classList.add('hidden');
    });

    elements.btnResumeGame.addEventListener('click', () => {
        const saved = GameStateManager.load();
        if (saved) {
            Object.assign(STATE, saved);
            elements.levelDisplay.textContent = `${STATE.mode.charAt(0).toUpperCase() + STATE.mode.slice(1)} • ${STATE.difficulty.charAt(0).toUpperCase() + STATE.difficulty.slice(1)}`;
            elements.mistakes.textContent = `${STATE.mistakes}/${SETTINGS.mistakeLimit === 0 ? "∞" : SETTINGS.mistakeLimit}`;
            elements.hints.textContent = STATE.hintsLeft;
            elements.timer.textContent = formatTime(STATE.time);
            
            elements.lvlSelectView.classList.add('hidden');
            elements.gameView.classList.remove('hidden');
            elements.btnBackMap.classList.remove('hidden');
            
            STATE.isPlaying = true;
            renderBoard();
            startTimer();
            GameStateManager.clear();
            elements.resumeBanner.classList.add('hidden');
        }
    });

    elements.btnPlayDaily.addEventListener('click', () => {
        SoundEngine.play('click');
        DailyChallengeManager.launch();
    });

    elements.btnCloseSettings.addEventListener('click', () => {
        SoundEngine.play('click');
        elements.settingsModal.classList.add('hidden');
    });
    
    elements.themeOpts.forEach(o => {
        o.addEventListener('click', () => {
            SoundEngine.play('click');
            SETTINGS.theme = o.dataset.t;
            applySettings();
        });
    });

    elements.toggleSound.addEventListener('click', () => {
        SETTINGS.sound = !SETTINGS.sound;
        SoundEngine.play('click');
        applySettings();
    });
    elements.volumeSlider.addEventListener('input', (e) => {
        SETTINGS.volume = parseFloat(e.target.value);
        applySettings();
    });
    elements.toggleAuto.addEventListener('click', () => {
        SETTINGS.autoComplete = !SETTINGS.autoComplete;
        SoundEngine.play('click');
        applySettings();
    });
    elements.toggleHighlight.addEventListener('click', () => {
        SETTINGS.highlightRegion = !SETTINGS.highlightRegion;
        SoundEngine.play('click');
        applySettings();
        updateHighlights();
    });

    elements.multiOpts.forEach(o => {
        o.addEventListener('click', () => {
            SoundEngine.play('click');
            SETTINGS.mistakeLimit = parseInt(o.dataset.limit);
            applySettings();
        });
    });

    elements.btnHowTo.addEventListener('click', () => {
        SoundEngine.play('click');
        elements.howToModal.classList.remove('hidden');
    });
    const closeHowTo = () => {
        SoundEngine.play('click');
        elements.howToModal.classList.add('hidden');
    };
    elements.btnCloseHowTo.addEventListener('click', closeHowTo);
    elements.btnCloseHowToBottom.addEventListener('click', closeHowTo);

    const howToData = {
        classic: `<h3>Classic Sudoku</h3>
                  <p><b>Rules:</b> Fill a 9x9 grid so that every row, column, and 3x3 box contains the numbers 1 to 9 without repeats.</p>
                  <p><b>Objective:</b> Complete the entire grid correctly.</p>
                  <p><b>Special Mechanics:</b> None. Pure logic.</p>
                  <p><b>How to Win:</b> Fill all cells correctly with zero mistakes remaining.</p>`,
        cross: `<h3>Cross Sudoku</h3>
                <p><b>Rules:</b> Standard Sudoku rules apply. Additionally, the two main diagonals of the 9x9 grid must also contain the numbers 1 to 9 exactly once.</p>
                <p><b>Objective:</b> Satisfy both grid and diagonal constraints.</p>
                <p><b>Special Mechanics:</b> Diagonals are highlighted for easier tracking.</p>
                <p><b>How to Win:</b> Complete the grid while respecting the "X" constraint.</p>`,
        killer: `<h3>Killer Sudoku</h3>
                 <p><b>Rules:</b> Standard rules apply. Additionally, there are dashed "cages" with a number in the corner. The sum of all numbers in a cage must equal that number.</p>
                 <p><b>Objective:</b> Deduce values based on sum logic and standard Sudoku rules.</p>
                 <p><b>Special Mechanics:</b> No number can repeat within a single cage.</p>
                 <p><b>How to Win:</b> Solve the grid using sum deduction.</p>`,
        math: `<h3>Math Sudoku</h3>
               <p><b>Rules:</b> Similar to Killer, but cages have a target and an operator (+, -, ×, ÷). Use the operator on cage values to reach the target.</p>
               <p><b>Objective:</b> Solve arithmetic puzzles within the Sudoku grid.</p>
               <p><b>Special Mechanics:</b> Order of operations matters for subtraction and division.</p>
               <p><b>How to Win:</b> Satisfy all mathematical cages and standard grid rules.</p>`,
        square: `<h3>Square Sudoku (4x4)</h3>
                 <p><b>Rules:</b> A compact 4x4 version. Each row, column, and 2x2 box must contain the numbers 1 to 4.</p>
                 <p><b>Objective:</b> Fast-paced Sudoku solving.</p>
                 <p><b>Special Mechanics:</b> Smaller grid, perfect for beginners.</p>
                 <p><b>How to Win:</b> Fill the 4x4 grid correctly.</p>`,
        alphabet: `<h3>Alphabet Sudoku</h3>
                   <p><b>Rules:</b> Standard Sudoku logic, but using letters <b>A to I</b> instead of 1 to 9.</p>
                   <p><b>Objective:</b> Complete the grid with unique letters per row, column, and box.</p>
                   <p><b>Special Mechanics:</b> Visual shift from numbers to letters.</p>
                   <p><b>How to Win:</b> Place all letters A-I correctly.</p>`
    };

    elements.howToTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            SoundEngine.play('click');
            elements.howToTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            elements.howToText.innerHTML = howToData[tab.dataset.mode];
        });
    });

    elements.btnRestartLvl.addEventListener('click', () => {
        SoundEngine.play('click');
        elements.settingsModal.classList.add('hidden');
        startNewGame();
    });

    elements.btnExitLvl.addEventListener('click', () => {
        SoundEngine.play('click');
        elements.settingsModal.classList.add('hidden');
        returnToLevelSelect();
    });
}

// Shared helper: stop game and return to level selection
function returnToLevelSelect() {
    stopTimer();
    STATE.isPlaying = false;
    if (elements.timerWrap) elements.timerWrap.classList.add('hidden');
    if (elements.victoryModal)  elements.victoryModal.classList.add('hidden');
    if (elements.gameOverModal) elements.gameOverModal.classList.add('hidden');
    elements.gameView.classList.add('hidden');
    elements.lvlSelectView.classList.remove('hidden');
    elements.btnBackMap.classList.add('hidden');
    renderLevelGrid();
}

let selectedSetupLevel = null;

function validateStartButton() {
    if (elements.btnStartGame) {
        const isReady = STATE.mode && STATE.difficulty && selectedSetupLevel !== null;
        elements.btnStartGame.disabled = !isReady;
        elements.btnStartGame.style.opacity = isReady ? '1' : '0.4';
        elements.btnStartGame.style.cursor = isReady ? 'pointer' : 'not-allowed';
    }
}

function launchCampaignLevel(lvl) {
    campaignLevel = lvl;
    elements.lvlSelectView.classList.add('hidden');
    elements.gameView.classList.remove('hidden');
    elements.btnBackMap.classList.remove('hidden');
    // Show timer only during gameplay
    if (elements.timerWrap) elements.timerWrap.classList.remove('hidden');
    if (elements.timerWrap) elements.timerWrap.style.display = 'flex';
    
    // Seed PRNG uniquely per mode, diff, and level
    let modeNum = {classic:1, cross:2, killer:3, math:4, square:5, alphabet:6}[STATE.mode] || 1;
    let diffNum = {easy:1, medium:2, hard:3, extreme:4}[STATE.difficulty] || 1;
    
    if (window.location.search.includes('mode=daily')) {
        let today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        currentSeed = parseInt(today) + modeNum;
        STATE.difficulty = 'hard'; // Daily is always hard
        elements.levelDisplay.textContent = `Daily Challenge • ${STATE.mode.charAt(0).toUpperCase() + STATE.mode.slice(1)}`;
        campaignLevel = null; // Mark as non-campaign
    } else {
        currentSeed = 997 * lvl + (modeNum * 1337) + (diffNum * 13);
        elements.levelDisplay.textContent = `${STATE.mode.charAt(0).toUpperCase() + STATE.mode.slice(1)} • ${STATE.difficulty.charAt(0).toUpperCase() + STATE.difficulty.slice(1)} • Lvl ${lvl}`;
    }
    prng = mulberry32(currentSeed);
    
    elements.levelBadge.classList.remove('hidden');
    
    // Add settings icon to top nav during gameplay if not already there
    if (!document.getElementById('btn-open-settings-game')) {
        let btn = document.createElement('button');
        btn.id = 'btn-open-settings-game';
        btn.className = 'icon-btn';
        btn.style.marginLeft = '10px';
        btn.innerHTML = '<i class="fas fa-cog"></i>';
        btn.addEventListener('click', () => {
            SoundEngine.play('click');
            elements.settingsModal.classList.remove('hidden');
        });
        elements.themeBtn.parentElement.appendChild(btn);
    }
    
    startNewGame();
}

function renderLevelGrid() {
    if (!elements.levelGrid) return;
    elements.levelGrid.innerHTML = '';

    // Load per-mode, per-difficulty progress from localStorage
    let saved = localStorage.getItem('am_grid_progress');
    let p = {};
    try { p = saved ? JSON.parse(saved) : {}; } catch(e) {}

    const mode = STATE.mode;
    const diff = STATE.difficulty;
    if (!p[mode]) p[mode] = {};
    if (!p[mode][diff]) p[mode][diff] = { maxUnlocked: 1, levels: {} };
    const dp = p[mode][diff];

    // Recalculate maxUnlocked from completed levels to be safe
    let highestCompleted = 0;
    for (let i = 1; i <= 100; i++) {
        if (dp.levels[i] && dp.levels[i].completed) highestCompleted = i;
    }
    // maxUnlocked = level after the last completed one (min 1)
    dp.maxUnlocked = Math.max(1, highestCompleted + 1);

    let completedCount = 0;
    for (let i = 1; i <= 100; i++) {
        const t = document.createElement('div');
        t.className = 'level-tile';

        const isCompleted = !!(dp.levels[i] && dp.levels[i].completed);
        const isUnlocked = i <= dp.maxUnlocked;
        const isNext = i === dp.maxUnlocked && !isCompleted;
        const isLocked = !isUnlocked;

        if (isCompleted) {
            t.classList.add('completed');
            completedCount++;
            t.innerHTML = `<span class="lvl-num">${i}</span><span class="lvl-state" style="color:var(--accent-2); font-size:0.7rem;">✓</span>`;
        } else if (isLocked) {
            t.classList.add('locked');
            t.style.pointerEvents = 'none';
            t.innerHTML = `<span class="lvl-num" style="font-size:0.75rem;opacity:0.4;">${i}</span><span class="lvl-state" style="font-size:0.65rem;">🔒</span>`;
        } else if (isNext) {
            t.classList.add('next');
            t.style.cursor = 'pointer';
            t.style.pointerEvents = 'auto';
            t.innerHTML = `<span class="lvl-num">${i}</span>`;
        } else {
            // Unlocked but not next (should not happen with current logic, but handle gracefully)
            t.style.cursor = 'pointer';
            t.style.pointerEvents = 'auto';
            t.innerHTML = `<span class="lvl-num">${i}</span>`;
        }

        if (i === selectedSetupLevel && !isLocked) t.classList.add('selected');

        if (!isLocked) {
            t.addEventListener('click', () => {
                SoundEngine.play('click');
                selectedSetupLevel = i;
                document.querySelectorAll('.level-tile').forEach(el => el.classList.remove('selected'));
                t.classList.add('selected');
                validateStartButton();
            });
        } else {
            t.addEventListener('click', () => SoundEngine.play('error'));
        }

        elements.levelGrid.appendChild(t);
    }

    if (elements.progStats) {
        elements.progStats.textContent = `${completedCount} / 100 Completed`;
    }
}

// Global Interaction to Start AudioContext
document.addEventListener('click', () => {
    if (SoundEngine.audioCtx && SoundEngine.audioCtx.state === 'suspended') {
        SoundEngine.audioCtx.resume();
    }
}, { once: false });

function initApp() {
    setupElements();
    loadStats();
    loadSettings();
    StreakManager.init();
    DailyChallengeManager.checkStatus();
    GameStateManager.checkResume();
    
    // Set initial state from active UI elements
    const activeMode = document.querySelector('.mode-tab.active');
    if (activeMode) STATE.mode = activeMode.dataset.mode;
    const activeDiff = document.querySelector('.diff-pill.active');
    if (activeDiff) STATE.difficulty = activeDiff.dataset.diff;

    bindEvents();
    renderLevelGrid();
    validateStartButton();

    // Auto-start if coming from Landing 'Play Now'
    if (window.location.search.includes('start=true')) {
        launchCampaignLevel(1);
    } else {
        // Show auth modal only if it's the first time and not already playing
        const hasSession = localStorage.getItem('am_user_session');
        if (!hasSession && elements.authModal) {
            elements.authModal.classList.remove('hidden');
        }
    }
}

// Global Initialization
window.addEventListener('DOMContentLoaded', initApp);
