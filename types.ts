export enum AppMode {
  POMODORO = 'POMODORO',
  STOPWATCH = 'STOPWATCH',
  TIMER = 'TIMER',
}

export enum PomodoroPhase {
  FOCUS = 'FOCUS',
  SHORT_BREAK = 'SHORT_BREAK',
  LONG_BREAK = 'LONG_BREAK',
}

export interface TimerState {
  timeLeft: number; // in seconds
  isActive: boolean;
  totalTime: number; // initial time for progress calculation
}

export interface Settings {
  focusDuration: number; // minutes
  shortBreakDuration: number; // minutes
  longBreakDuration: number; // minutes
}

export const DEFAULT_SETTINGS: Settings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
};
