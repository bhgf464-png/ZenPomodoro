import { getMindfulnessTip } from './services/geminiService.js';

// --- Constants ---
const MODES = {
  POMODORO: 'POMODORO',
  STOPWATCH: 'STOPWATCH',
  TIMER: 'TIMER'
};

const PHASES = {
  FOCUS: 'FOCUS',
  SHORT_BREAK: 'SHORT_BREAK',
  LONG_BREAK: 'LONG_BREAK'
};

const COLORS = {
  FOCUS: '#ff6347',
  SHORT_BREAK: '#66cdaa',
  LONG_BREAK: '#66cdaa',
  STOPWATCH: '#60a5fa',
  TIMER: '#fbbf24',
  ACTIVE_BTN_BG: '#e5e7eb',
  ACTIVE_BTN_TEXT: '#1f2937'
};

// --- State ---
const state = {
  mode: MODES.POMODORO,
  phase: PHASES.FOCUS,
  timeLeft: 25 * 60,
  totalTime: 25 * 60,
  isActive: false,
  stopwatchTime: 0,
  settings: {
    focus: 25,
    short: 5,
    long: 15
  },
  lastTick: 0,
  requestID: null,
  tipLoading: false
};

// --- DOM Elements ---
const el = {
  timerDisplay: document.getElementById('timer-display'),
  timerLabel: document.getElementById('timer-label'),
  progressRing: document.getElementById('progress-ring'),
  timerGlow: document.getElementById('timer-glow'),
  btnToggle: document.getElementById('btn-toggle'),
  btnReset: document.getElementById('btn-reset'),
  btnTip: document.getElementById('btn-tip'),
  iconPlay: document.getElementById('icon-play'),
  iconPause: document.getElementById('icon-pause'),
  iconSparkles: document.getElementById('icon-sparkles'),
  phaseToggles: document.getElementById('phase-toggles'),
  phaseBtns: document.querySelectorAll('.phase-btn'),
  navBtns: document.querySelectorAll('.nav-btn'),
  tipContainer: document.getElementById('tip-container'),
  tipText: document.getElementById('tip-text'),
  settingsModal: document.getElementById('settings-modal'),
  btnOpenSettings: document.getElementById('btn-open-settings'),
  btnCloseSettings: document.getElementById('btn-close-settings'),
  btnSaveSettings: document.getElementById('btn-save-settings'),
  inputFocus: document.getElementById('input-focus'),
  inputShort: document.getElementById('input-short'),
  inputLong: document.getElementById('input-long')
};

// --- Init Ring ---
const radius = el.progressRing.r.baseVal.value;
const circumference = radius * 2 * Math.PI;
el.progressRing.style.strokeDasharray = `${circumference} ${circumference}`;
el.progressRing.style.strokeDashoffset = 0;

// --- Helper Functions ---
const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const getAccentColor = () => {
  if (state.mode === MODES.STOPWATCH) return COLORS.STOPWATCH;
  if (state.mode === MODES.TIMER) return COLORS.TIMER;
  if (state.phase === PHASES.FOCUS) return COLORS.FOCUS;
  return COLORS.SHORT_BREAK;
};

const setProgress = (percent) => {
  const offset = circumference - (percent / 100) * circumference;
  el.progressRing.style.strokeDashoffset = offset;
};

const updateUI = () => {
  // Colors
  const accent = getAccentColor();
  el.progressRing.style.stroke = accent;
  el.timerGlow.style.backgroundColor = accent;
  
  // Toggle Button Appearance
  if (state.isActive) {
    el.btnToggle.style.backgroundColor = COLORS.ACTIVE_BTN_BG;
    el.btnToggle.style.color = COLORS.ACTIVE_BTN_TEXT;
    el.iconPlay.classList.add('hidden');
    el.iconPause.classList.remove('hidden');
  } else {
    el.btnToggle.style.backgroundColor = accent;
    el.btnToggle.style.color = '#fff';
    el.iconPlay.classList.remove('hidden');
    el.iconPause.classList.add('hidden');
  }

  // Timer Text
  let displayTime = state.timeLeft;
  if (state.mode === MODES.STOPWATCH) {
    displayTime = state.stopwatchTime;
  }
  el.timerDisplay.textContent = formatTime(displayTime);

  // Label
  if (state.mode === MODES.POMODORO) {
    el.timerLabel.textContent = state.phase === PHASES.FOCUS ? 'Focus' : (state.phase === PHASES.SHORT_BREAK ? 'Short Break' : 'Long Break');
    el.phaseToggles.style.opacity = '1';
    el.phaseToggles.style.pointerEvents = 'auto';
  } else {
    el.timerLabel.textContent = state.mode === MODES.STOPWATCH ? 'Stopwatch' : 'Timer';
    el.phaseToggles.style.opacity = '0';
    el.phaseToggles.style.pointerEvents = 'none';
  }

  // Progress
  let progress = 0;
  if (state.mode === MODES.STOPWATCH) {
    progress = 100;
  } else if (state.totalTime > 0) {
    progress = ((state.totalTime - state.timeLeft) / state.totalTime) * 100;
  }
  setProgress(progress);

  // Active States for Nav
  el.navBtns.forEach(btn => {
    if (btn.dataset.mode === state.mode) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Active States for Phase
  el.phaseBtns.forEach(btn => {
    if (btn.dataset.phase === state.phase) {
      btn.classList.add('active', 'bg-gray-700', 'text-white', 'shadow-sm');
      btn.classList.remove('bg-transparent', 'text-gray-500');
    } else {
      btn.classList.remove('active', 'bg-gray-700', 'text-white', 'shadow-sm');
      btn.classList.add('bg-transparent', 'text-gray-500');
    }
  });
};

// --- Core Logic ---
const tick = () => {
  const now = Date.now();
  const delta = now - state.lastTick;

  if (delta >= 1000) {
    const secondsPassed = Math.floor(delta / 1000);
    state.lastTick = now - (delta % 1000);

    if (state.mode === MODES.STOPWATCH) {
      state.stopwatchTime += secondsPassed;
    } else {
      if (state.timeLeft <= secondsPassed) {
        state.timeLeft = 0;
        state.isActive = false;
        cancelAnimationFrame(state.requestID);
        
        // Auto-fetch tip if Focus ends
        if (state.mode === MODES.POMODORO && state.phase === PHASES.FOCUS) {
          fetchTip(true);
        }
      } else {
        state.timeLeft -= secondsPassed;
      }
    }
    updateUI();
  }

  if (state.isActive) {
    state.requestID = requestAnimationFrame(tick);
  }
};

const toggleTimer = () => {
  state.isActive = !state.isActive;
  if (state.isActive) {
    state.lastTick = Date.now();
    tick();
  } else {
    cancelAnimationFrame(state.requestID);
  }
  updateUI();
};

const resetTimer = () => {
  state.isActive = false;
  cancelAnimationFrame(state.requestID);
  
  if (state.mode === MODES.STOPWATCH) {
    state.stopwatchTime = 0;
  } else if (state.mode === MODES.POMODORO) {
    let duration;
    if (state.phase === PHASES.FOCUS) duration = state.settings.focus;
    else if (state.phase === PHASES.SHORT_BREAK) duration = state.settings.short;
    else duration = state.settings.long;
    
    state.timeLeft = duration * 60;
    state.totalTime = duration * 60;
  } else {
    // Timer default
    state.timeLeft = 5 * 60;
    state.totalTime = 5 * 60;
  }
  updateUI();
};

const setMode = (mode) => {
  state.mode = mode;
  state.isActive = false;
  cancelAnimationFrame(state.requestID);
  
  if (mode === MODES.POMODORO) {
    setPhase(PHASES.FOCUS); // Resets timer inside
  } else if (mode === MODES.STOPWATCH) {
    state.stopwatchTime = 0;
    updateUI();
  } else {
    // Timer
    state.timeLeft = 5 * 60;
    state.totalTime = 5 * 60;
    updateUI();
  }
};

const setPhase = (phase) => {
  state.phase = phase;
  state.isActive = false;
  cancelAnimationFrame(state.requestID);

  let duration;
  if (phase === PHASES.FOCUS) duration = state.settings.focus;
  else if (phase === PHASES.SHORT_BREAK) duration = state.settings.short;
  else duration = state.settings.long;

  state.timeLeft = duration * 60;
  state.totalTime = duration * 60;
  updateUI();
};

// --- AI Service Integration ---
const fetchTip = async (auto = false) => {
  if (state.tipLoading) return;
  
  state.tipLoading = true;
  el.iconSparkles.classList.add('text-amber-300', 'animate-pulse');
  el.tipContainer.classList.add('hidden');

  let context = 'Productivity';
  if (state.mode === MODES.POMODORO) {
    context = state.phase === PHASES.FOCUS ? 'Focus Completed' : 'Relaxing Break';
  }

  const tip = await getMindfulnessTip(context);
  
  el.tipText.textContent = `"${tip}"`;
  el.tipContainer.classList.remove('hidden');
  el.iconSparkles.classList.remove('text-amber-300', 'animate-pulse');
  state.tipLoading = false;
};

// --- Event Listeners ---
el.btnToggle.addEventListener('click', toggleTimer);
el.btnReset.addEventListener('click', resetTimer);

el.btnTip.addEventListener('click', () => fetchTip());
el.tipContainer.addEventListener('click', () => el.tipContainer.classList.add('hidden'));

el.navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.dataset.mode;
    setMode(mode);
  });
});

el.phaseBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const phase = btn.dataset.phase;
    setPhase(phase);
  });
});

// Settings Modal
el.btnOpenSettings.addEventListener('click', () => {
  el.inputFocus.value = state.settings.focus;
  el.inputShort.value = state.settings.short;
  el.inputLong.value = state.settings.long;
  el.settingsModal.classList.remove('hidden');
});

const closeSettings = () => el.settingsModal.classList.add('hidden');
el.btnCloseSettings.addEventListener('click', closeSettings);

el.btnSaveSettings.addEventListener('click', () => {
  state.settings.focus = parseInt(el.inputFocus.value) || 25;
  state.settings.short = parseInt(el.inputShort.value) || 5;
  state.settings.long = parseInt(el.inputLong.value) || 15;
  
  if (state.mode === MODES.POMODORO) {
    // Force reset to apply new settings
    setPhase(state.phase);
  }
  closeSettings();
});

// Initial Render
updateUI();
