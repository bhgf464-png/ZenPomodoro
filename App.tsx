import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CircularTimer } from './components/CircularTimer';
import { Button } from './components/Button';
import { PlayIcon, PauseIcon, ResetIcon, ClockIcon, StopwatchIcon, HourglassIcon, SparklesIcon, SettingsIcon } from './components/Icons';
import { AppMode, PomodoroPhase, DEFAULT_SETTINGS, Settings as SettingsType } from './types';
import { getMindfulnessTip } from './services/geminiService';

const App: React.FC = () => {
  // --- State ---
  const [mode, setMode] = useState<AppMode>(AppMode.POMODORO);
  const [phase, setPhase] = useState<PomodoroPhase>(PomodoroPhase.FOCUS);
  const [timeLeft, setTimeLeft] = useState<number>(DEFAULT_SETTINGS.focusDuration * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [totalTime, setTotalTime] = useState<number>(DEFAULT_SETTINGS.focusDuration * 60);
  const [settings, setSettings] = useState<SettingsType>(DEFAULT_SETTINGS);
  const [stopwatchTime, setStopwatchTime] = useState<number>(0);
  const [tip, setTip] = useState<string | null>(null);
  const [loadingTip, setLoadingTip] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // For accurate timing (handling background tabs)
  const lastTickRef = useRef<number>(Date.now());
  const requestRef = useRef<number>();

  // --- Helpers ---
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getAccentColor = useCallback(() => {
    if (mode === AppMode.STOPWATCH) return '#60a5fa'; // Blue
    if (mode === AppMode.TIMER) return '#fbbf24'; // Amber
    if (phase === PomodoroPhase.FOCUS) return '#ff6347'; // Tomato
    return '#66cdaa'; // Soft Green for breaks
  }, [mode, phase]);

  const getPhaseLabel = () => {
    switch (phase) {
      case PomodoroPhase.FOCUS: return 'Focus';
      case PomodoroPhase.SHORT_BREAK: return 'Short Break';
      case PomodoroPhase.LONG_BREAK: return 'Long Break';
    }
  };

  // --- Timer Logic ---
  const tick = useCallback(() => {
    const now = Date.now();
    const delta = now - lastTickRef.current;
    
    if (delta >= 1000) {
      const secondsPassed = Math.floor(delta / 1000);
      lastTickRef.current = now - (delta % 1000); // Adjust for drift

      if (mode === AppMode.STOPWATCH) {
        setStopwatchTime(prev => prev + secondsPassed);
      } else {
        setTimeLeft(prev => {
          if (prev <= secondsPassed) {
             setIsActive(false);
             if (mode === AppMode.POMODORO && phase === PomodoroPhase.FOCUS) {
                // Auto fetch tip on completion of focus
                handleGetTip(true);
             }
             return 0;
          }
          return prev - secondsPassed;
        });
      }
    }
    requestRef.current = requestAnimationFrame(tick);
  }, [mode, phase]);

  useEffect(() => {
    if (isActive) {
      lastTickRef.current = Date.now();
      requestRef.current = requestAnimationFrame(tick);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isActive, tick]);

  // --- Handlers ---
  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    if (mode === AppMode.STOPWATCH) {
      setStopwatchTime(0);
    } else if (mode === AppMode.POMODORO) {
       let duration = 0;
       if (phase === PomodoroPhase.FOCUS) duration = settings.focusDuration;
       else if (phase === PomodoroPhase.SHORT_BREAK) duration = settings.shortBreakDuration;
       else duration = settings.longBreakDuration;
       setTimeLeft(duration * 60);
       setTotalTime(duration * 60);
    } else {
       // Timer mode reset (default to 5 mins for now if no input)
       setTimeLeft(5 * 60);
       setTotalTime(5 * 60);
    }
  };

  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    setIsActive(false);
    setTip(null);
    
    if (newMode === AppMode.POMODORO) {
      setPhase(PomodoroPhase.FOCUS);
      setTimeLeft(settings.focusDuration * 60);
      setTotalTime(settings.focusDuration * 60);
    } else if (newMode === AppMode.STOPWATCH) {
      setStopwatchTime(0);
    } else {
      setTimeLeft(5 * 60); // Default custom timer
      setTotalTime(5 * 60);
    }
  };

  const handlePhaseChange = (newPhase: PomodoroPhase) => {
    setPhase(newPhase);
    setIsActive(false);
    setTip(null);
    let duration = 0;
    if (newPhase === PomodoroPhase.FOCUS) duration = settings.focusDuration;
    else if (newPhase === PomodoroPhase.SHORT_BREAK) duration = settings.shortBreakDuration;
    else duration = settings.longBreakDuration;
    setTimeLeft(duration * 60);
    setTotalTime(duration * 60);
  };

  const handleGetTip = async (auto = false) => {
    setLoadingTip(true);
    setTip(null);
    const context = mode === AppMode.POMODORO ? (phase === PomodoroPhase.FOCUS ? 'Focus Completed' : 'Relaxing Break') : 'Productivity';
    const newTip = await getMindfulnessTip(context);
    setTip(newTip);
    setLoadingTip(false);
  };

  // --- Render ---
  const progress = mode === AppMode.STOPWATCH 
    ? 100 
    : totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-900 text-gray-200 font-sans selection:bg-tomato selection:text-white flex flex-col overflow-hidden relative">
      
      {/* --- Top Bar --- */}
      <header className="flex justify-between items-center p-6 w-full max-w-md mx-auto z-10">
        <h1 className="text-lg font-semibold tracking-wide text-gray-400 uppercase text-xs">ZenPomodoro</h1>
        <button onClick={() => setShowSettings(!showSettings)} className="text-gray-500 hover:text-white transition-colors">
          <SettingsIcon />
        </button>
      </header>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto px-6 z-10">
        
        {/* Mode Toggles (for Pomodoro Phases) */}
        {mode === AppMode.POMODORO && (
          <div className="flex space-x-2 mb-8 bg-gray-800/50 p-1.5 rounded-2xl backdrop-blur-sm">
            {[PomodoroPhase.FOCUS, PomodoroPhase.SHORT_BREAK, PomodoroPhase.LONG_BREAK].map((p) => (
              <Button
                key={p}
                variant="secondary"
                active={phase === p}
                onClick={() => handlePhaseChange(p)}
                className={`text-xs px-4 py-2 ${phase === p ? 'bg-gray-700 text-white shadow-sm' : 'bg-transparent text-gray-500 hover:text-gray-300 shadow-none'}`}
              >
                {p === PomodoroPhase.FOCUS ? 'Focus' : p === PomodoroPhase.SHORT_BREAK ? 'Short' : 'Long'}
              </Button>
            ))}
          </div>
        )}

        {/* Circular Timer Display */}
        <div className="relative mb-12 group">
             {/* Glow effect behind timer */}
            <div 
                className="absolute inset-0 rounded-full blur-3xl opacity-20 transition-colors duration-700"
                style={{ backgroundColor: getAccentColor() }}
            ></div>
            
          <CircularTimer 
            radius={140} 
            stroke={6} 
            progress={progress} 
            color={getAccentColor()}
          >
             <div className="flex flex-col items-center justify-center space-y-2">
                <span className="text-6xl font-bold tracking-tight text-white tabular-nums">
                  {mode === AppMode.STOPWATCH ? formatTime(stopwatchTime) : formatTime(timeLeft)}
                </span>
                <span className="text-sm uppercase tracking-widest text-gray-500 font-medium">
                  {mode === AppMode.POMODORO ? getPhaseLabel() : mode === AppMode.STOPWATCH ? 'Stopwatch' : 'Timer'}
                </span>
             </div>
          </CircularTimer>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center space-x-6 mb-8">
            <Button 
                variant="ghost" 
                onClick={resetTimer} 
                className="p-4 rounded-full text-gray-500 hover:bg-gray-800"
                title="Reset"
            >
                <ResetIcon className="w-6 h-6" />
            </Button>

            <Button 
                variant="primary" 
                onClick={toggleTimer} 
                className="w-20 h-20 rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-transform"
                style={{ backgroundColor: isActive ? '#e5e7eb' : getAccentColor(), color: isActive ? '#1f2937' : '#fff' }}
            >
                {isActive ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8 ml-1" />}
            </Button>
            
             <Button 
                variant="ghost" 
                onClick={() => handleGetTip()} 
                className={`p-4 rounded-full hover:bg-gray-800 relative group ${loadingTip ? 'animate-pulse' : ''}`}
                title="Mindfulness Tip"
                disabled={loadingTip}
            >
                <SparklesIcon className={`w-6 h-6 ${tip ? 'text-amber-300' : 'text-gray-500'}`} />
                 {/* Tooltip for AI */}
                 <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-xs text-gray-300 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Zen Insight
                 </span>
            </Button>
        </div>

        {/* AI Tip Display */}
        {tip && (
            <div className="mt-2 mb-6 p-4 bg-gray-800/40 backdrop-blur rounded-xl border border-white/5 max-w-xs text-center animate-pulse-slow">
                <p className="text-sm font-light text-gray-300 leading-relaxed italic">"{tip}"</p>
                <button onClick={() => setTip(null)} className="mt-2 text-xs text-gray-500 hover:text-white">dismiss</button>
            </div>
        )}

      </main>

      {/* --- Bottom Navigation --- */}
      <nav className="w-full max-w-md mx-auto p-4 pb-8 z-10">
        <div className="bg-gray-800/80 backdrop-blur-md rounded-2xl p-1 flex justify-around items-center shadow-2xl border border-white/5">
            <NavButton 
                active={mode === AppMode.POMODORO} 
                onClick={() => handleModeChange(AppMode.POMODORO)} 
                icon={<ClockIcon />} 
                label="Pomodoro" 
            />
            <NavButton 
                active={mode === AppMode.STOPWATCH} 
                onClick={() => handleModeChange(AppMode.STOPWATCH)} 
                icon={<StopwatchIcon />} 
                label="Stopwatch" 
            />
            <NavButton 
                active={mode === AppMode.TIMER} 
                onClick={() => handleModeChange(AppMode.TIMER)} 
                icon={<HourglassIcon />} 
                label="Timer" 
            />
        </div>
      </nav>

       {/* --- Settings Modal --- */}
       {showSettings && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Settings</h2>
                    <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-white">Close</button>
                </div>
                
                <div className="space-y-4">
                    <SettingInput label="Focus (min)" value={settings.focusDuration} onChange={v => setSettings({...settings, focusDuration: v})} />
                    <SettingInput label="Short Break (min)" value={settings.shortBreakDuration} onChange={v => setSettings({...settings, shortBreakDuration: v})} />
                    <SettingInput label="Long Break (min)" value={settings.longBreakDuration} onChange={v => setSettings({...settings, longBreakDuration: v})} />
                </div>

                <Button variant="primary" className="w-full mt-8 py-3" onClick={() => {
                    resetTimer();
                    setShowSettings(false);
                }}>
                    Save & Reset Timer
                </Button>
            </div>
        </div>
      )}

    </div>
  );
};

// Sub-components for cleaner App.tsx
const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
    <button 
        onClick={onClick}
        className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all duration-300 ${active ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'}`}
    >
        <div className={`w-6 h-6 mb-1 ${active ? 'scale-110' : 'scale-100'} transition-transform`}>{icon}</div>
        <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </button>
);

const SettingInput = ({ label, value, onChange }: { label: string, value: number, onChange: (val: number) => void }) => (
    <div className="flex justify-between items-center bg-gray-800/50 p-3 rounded-xl">
        <label className="text-gray-300 text-sm font-medium">{label}</label>
        <input 
            type="number" 
            value={value} 
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-16 bg-transparent text-right text-white font-bold outline-none border-b border-gray-700 focus:border-tomato transition-colors"
        />
    </div>
);

export default App;
