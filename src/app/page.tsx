"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { playNotificationSound, playBreakSound, showNotification, requestNotificationPermission } from "@/lib/audio";
import { 
  FaPlay, 
  FaPause, 
  FaRedo, 
  FaForward, 
  FaCog, 
  FaBell, 
  FaHome,
  FaCheckCircle,
  FaClock,
  FaBolt
} from "react-icons/fa";

type TimerMode = "work" | "shortBreak" | "longBreak";
type TimerState = "idle" | "running" | "paused" | "completed";

interface TimerSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number; // after how many work sessions
  autoStart: boolean; // whether to auto-start next session
}

export default function Home() {
  const [settings, setSettings] = useState<TimerSettings>({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    autoStart: false, // Default to manual start for better user control
  });

  const [mode, setMode] = useState<TimerMode>("work");
  const [state, setState] = useState<TimerState>("idle");
  const [timeLeft, setTimeLeft] = useState(25 * 60); // in seconds
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalWorkTime, setTotalWorkTime] = useState(0); // in minutes

  // Use refs to avoid stale closures
  const settingsRef = useRef(settings);
  const modeRef = useRef(mode);
  const completedSessionsRef = useRef(completedSessions);

  // Update refs when state changes
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    completedSessionsRef.current = completedSessions;
  }, [completedSessions]);

  // Calculate time display
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeDisplay = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  // Update document title based on timer state
  useEffect(() => {
    const getModeTitle = (currentMode: TimerMode) => {
      switch (currentMode) {
        case "work":
          return "Focus";
        case "shortBreak":
          return "Break";
        case "longBreak":
          return "Long Break";
      }
    };

    if (state === "running") {
      const modeTitle = getModeTitle(mode);
      document.title = `(${timeDisplay}) ${modeTitle} - Pomodoro Timer`;
    } else if (state === "paused") {
      const modeTitle = getModeTitle(mode);
      document.title = `⏸️ (${timeDisplay}) ${modeTitle} - Pomodoro Timer`;
    } else {
      document.title = "Pomodoro Timer";
    }
  }, [timeDisplay, mode, state]);

  // Get mode display info
  const getModeInfo = (currentMode: TimerMode) => {
    switch (currentMode) {
      case "work":
        return { title: "Focus Time", color: "bg-red-500", bgColor: "bg-red-50", textColor: "text-red-700" };
      case "shortBreak":
        return { title: "Short Break", color: "bg-green-500", bgColor: "bg-green-50", textColor: "text-green-700" };
      case "longBreak":
        return { title: "Long Break", color: "bg-blue-500", bgColor: "bg-blue-50", textColor: "text-blue-700" };
    }
  };

  const modeInfo = getModeInfo(mode);

  // Get duration for current mode
  const getDurationForMode = useCallback((currentMode: TimerMode) => {
    switch (currentMode) {
      case "work":
        return settings.workDuration * 60;
      case "shortBreak":
        return settings.shortBreakDuration * 60;
      case "longBreak":
        return settings.longBreakDuration * 60;
    }
  }, [settings]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (state === "running" && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setState("completed");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state, timeLeft]);

  // Handle timer completion
  useEffect(() => {
    if (state === "completed") {
      try {
        // Play appropriate sound and show notification
        if (modeRef.current === "work") {
          playBreakSound();
          showNotification("Work Session Complete!", "Time for a break. Great job staying focused!");
          setCompletedSessions(prev => prev + 1);
          setTotalWorkTime(prev => prev + settingsRef.current.workDuration);
          
          // Determine next mode
          const nextSession = completedSessionsRef.current + 1;
          if (nextSession % settingsRef.current.longBreakInterval === 0) {
            setMode("longBreak");
            setTimeLeft(settingsRef.current.longBreakDuration * 60);
          } else {
            setMode("shortBreak");
            setTimeLeft(settingsRef.current.shortBreakDuration * 60);
          }
        } else {
          // Break completed, go back to work
          playNotificationSound();
          showNotification("Break Complete!", "Time to get back to work. Stay productive!");
          setMode("work");
          setTimeLeft(settingsRef.current.workDuration * 60);
        }
        
        // Auto-start next session if enabled
        if (settingsRef.current.autoStart) {
          setState("running");
        } else {
          setState("idle");
        }
      } catch (error) {
        console.error("Error in timer completion:", error);
        setState("idle");
      }
    }
  }, [state]);

  // Timer controls
  const startTimer = useCallback(() => {
    setState("running");
  }, []);

  const pauseTimer = useCallback(() => {
    setState("paused");
  }, []);

  const resetTimer = useCallback(() => {
    setState("idle");
    const duration = getDurationForMode(mode);
    setTimeLeft(duration);
  }, [mode, getDurationForMode]);

  const skipTimer = useCallback(() => {
    setState("completed");
  }, []);

  // Switch modes
  const switchToMode = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    setState("idle");
    const duration = getDurationForMode(newMode);
    setTimeLeft(duration);
  }, [getDurationForMode]);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<TimerSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      // Update timer if it's idle and we're changing the current mode's duration
      if (state === "idle") {
        const currentDuration = getDurationForMode(mode);
        const newDuration = (() => {
          switch (mode) {
            case "work":
              return (newSettings.workDuration || prev.workDuration) * 60;
            case "shortBreak":
              return (newSettings.shortBreakDuration || prev.shortBreakDuration) * 60;
            case "longBreak":
              return (newSettings.longBreakDuration || prev.longBreakDuration) * 60;
          }
        })();
        if (newDuration !== currentDuration) {
          setTimeLeft(newDuration);
        }
      }
      return updated;
    });
  }, [mode, state, getDurationForMode]);

  return (
    <div className="font-sans max-w-4xl mx-auto py-10 px-4 sm:px-6 space-y-8">


      {/* Timer Display */}
      <div className={`rounded-2xl p-8 text-center ${modeInfo.bgColor}`}>
        <div className="mb-6">
          <h2 className={`text-xl font-semibold ${modeInfo.textColor}`}>
            {modeInfo.title}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Session {completedSessions + 1}
          </p>
        </div>

        <div className="text-6xl font-mono font-bold mb-8">
          {timeDisplay}
        </div>

        {/* Timer Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {state === "idle" && (
            <button
              onClick={startTimer}
              className={`px-6 py-3 rounded-lg text-white font-medium ${modeInfo.color} hover:opacity-90 transition-opacity flex items-center gap-2`}
            >
              <FaPlay className="w-4 h-4" />
              Start
            </button>
          )}
          
          {state === "running" && (
            <>
              <button
                onClick={pauseTimer}
                className="px-6 py-3 rounded-lg bg-gray-500 text-white font-medium hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <FaPause className="w-4 h-4" />
                Pause
              </button>
              <button
                onClick={skipTimer}
                className="px-4 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <FaForward className="w-4 h-4" />
                Skip
              </button>
            </>
          )}
          
          {state === "paused" && (
            <>
              <button
                onClick={startTimer}
                className={`px-6 py-3 rounded-lg text-white font-medium ${modeInfo.color} hover:opacity-90 transition-opacity flex items-center gap-2`}
              >
                <FaPlay className="w-4 h-4" />
                Resume
              </button>
              <button
                onClick={resetTimer}
                className="px-4 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <FaRedo className="w-4 h-4" />
                Reset
              </button>
            </>
          )}
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => switchToMode("work")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "work" 
                ? "bg-red-500 text-white" 
                : "bg-white text-red-600 border border-red-200 hover:bg-red-50"
            }`}
          >
            Work
          </button>
          <button
            onClick={() => switchToMode("shortBreak")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "shortBreak" 
                ? "bg-green-500 text-white" 
                : "bg-white text-green-600 border border-green-200 hover:bg-green-50"
            }`}
          >
            Short Break
          </button>
          <button
            onClick={() => switchToMode("longBreak")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "longBreak" 
                ? "bg-blue-500 text-white" 
                : "bg-white text-blue-600 border border-blue-200 hover:bg-blue-50"
            }`}
          >
            Long Break
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border p-4 text-center">
          <div className="text-sm text-gray-500 flex items-center justify-center gap-1 mb-1">
            <FaCheckCircle className="w-4 h-4" />
            Completed Sessions
          </div>
          <div className="text-2xl font-bold text-red-600">{completedSessions}</div>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <div className="text-sm text-gray-500 flex items-center justify-center gap-1 mb-1">
            <FaClock className="w-4 h-4" />
            Total Work Time
          </div>
          <div className="text-2xl font-bold text-green-600">{totalWorkTime} min</div>
        </div>
        <div className="rounded-lg border p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => updateSettings({ autoStart: !settings.autoStart })}>
          <div className="text-sm text-gray-500 flex items-center justify-center gap-1 mb-1">
            <FaBolt className="w-4 h-4" />
            Auto-start
          </div>
          <div className={`text-lg font-semibold ${settings.autoStart ? 'text-green-600' : 'text-gray-600'}`}>
            {settings.autoStart ? 'ON' : 'OFF'}
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FaCog className="w-5 h-5" />
          Timer Settings
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Work Duration (min)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={settings.workDuration}
              onChange={(e) => updateSettings({ workDuration: parseInt(e.target.value) || 25 })}
              className="w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Short Break (min)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={settings.shortBreakDuration}
              onChange={(e) => updateSettings({ shortBreakDuration: parseInt(e.target.value) || 5 })}
              className="w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Long Break (min)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={settings.longBreakDuration}
              onChange={(e) => updateSettings({ longBreakDuration: parseInt(e.target.value) || 15 })}
              className="w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Long Break Interval
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={settings.longBreakInterval}
              onChange={(e) => updateSettings({ longBreakInterval: parseInt(e.target.value) || 4 })}
              className="w-full rounded border px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Auto-start Info */}
      <div className="border rounded-lg p-6 bg-purple-50">
        <h3 className="text-lg font-semibold mb-3 text-purple-800 flex items-center gap-2">
          <FaBolt className="w-5 h-5" />
          Auto-start Feature
        </h3>
        <p className="text-sm text-purple-700 mb-3">
          When enabled, the timer will automatically start the next session (work or break) when the current session completes. 
          When disabled, you'll need to manually click "Start" to begin each session.
        </p>
        <div className="text-sm text-purple-600">
          <strong>Tip:</strong> Use manual mode if you want more control over when to start each session, 
          or auto mode for a more hands-off experience.
        </div>
      </div>

      {/* Notification Settings */}
      <div className="border rounded-lg p-6 bg-yellow-50">
        <h3 className="text-lg font-semibold mb-3 text-yellow-800 flex items-center gap-2">
          <FaBell className="w-5 h-5" />
          Notifications
        </h3>
        <p className="text-sm text-yellow-700 mb-3">
          Enable browser notifications to get alerted when your timer completes, even when the tab is not active.
        </p>
        <button
          onClick={requestNotificationPermission}
          className="px-4 py-2 rounded bg-yellow-500 text-white font-medium hover:bg-yellow-600 transition-colors flex items-center gap-2"
        >
          Enable Notifications
        </button>
      </div>

      {/* Productivity Tips */}
      <div className="border rounded-lg p-6 bg-blue-50">
        <h3 className="text-lg font-semibold mb-3 text-blue-800 flex items-center gap-2">
          Productivity Tips
        </h3>
        <ul className="space-y-2 text-sm text-blue-700">
          <li>• Use the timer to maintain focus during work sessions</li>
          <li>• Take short breaks to prevent mental fatigue</li>
          <li>• Use long breaks to recharge and reflect</li>
          <li>• Avoid distractions during work sessions</li>
          <li>• Track your progress to stay motivated</li>
        </ul>
      </div>
    </div>
  );
}
