"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { playNotificationSound, playBreakSound } from "@/lib/audio";
import { 
  FaPlay, 
  FaPause, 
  FaRedo, 
  FaClock,
  FaExternalLinkAlt
} from "react-icons/fa";

type TimerMode = "work" | "shortBreak" | "longBreak";
type TimerState = "idle" | "running" | "paused" | "completed";

interface PomodoroWidgetProps {
  compact?: boolean;
  autoStart?: boolean; // whether to auto-start next session
}

export default function PomodoroWidget({ compact = false, autoStart = false }: PomodoroWidgetProps) {
  const [mode, setMode] = useState<TimerMode>("work");
  const [state, setState] = useState<TimerState>("idle");
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [completedSessions, setCompletedSessions] = useState(0);

  // Use refs to avoid stale closures
  const modeRef = useRef(mode);
  const completedSessionsRef = useRef(completedSessions);

  // Update refs when state changes
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

  // Get mode display info
  const getModeInfo = (currentMode: TimerMode) => {
    switch (currentMode) {
      case "work":
        return { title: "Focus", color: "bg-red-500", bgColor: "bg-red-50", textColor: "text-red-700" };
      case "shortBreak":
        return { title: "Break", color: "bg-green-500", bgColor: "bg-green-50", textColor: "text-green-700" };
      case "longBreak":
        return { title: "Long Break", color: "bg-blue-500", bgColor: "bg-blue-50", textColor: "text-blue-700" };
    }
  };

  const modeInfo = getModeInfo(mode);

  // Get duration for current mode
  const getDurationForMode = useCallback((currentMode: TimerMode) => {
    switch (currentMode) {
      case "work":
        return 25 * 60; // 25 minutes
      case "shortBreak":
        return 5 * 60; // 5 minutes
      case "longBreak":
        return 15 * 60; // 15 minutes
    }
  }, []);

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
        // Play appropriate sound
        if (modeRef.current === "work") {
          playBreakSound();
          setCompletedSessions(prev => prev + 1);
          
          // Determine next mode
          const nextSession = completedSessionsRef.current + 1;
          if (nextSession % 4 === 0) {
            setMode("longBreak");
            setTimeLeft(15 * 60); // 15 minutes
          } else {
            setMode("shortBreak");
            setTimeLeft(5 * 60); // 5 minutes
          }
        } else {
          // Break completed, go back to work
          playNotificationSound();
          setMode("work");
          setTimeLeft(25 * 60); // 25 minutes
        }
        
        // Auto-start next session if enabled
        if (autoStart) {
          setState("running");
        } else {
          setState("idle");
        }
      } catch (error) {
        console.error("Error in timer completion:", error);
        setState("idle");
      }
    }
  }, [state, autoStart]);

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

  if (compact) {
    return (
      <div className={`rounded-lg border p-4 ${modeInfo.bgColor}`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-medium ${modeInfo.textColor}`}>
            {modeInfo.title}
          </span>
          <span className="text-xs text-gray-500">
            {completedSessions} sessions
          </span>
        </div>
        
        <div className="text-2xl font-mono font-bold mb-3">
          {timeDisplay}
        </div>
        
        <div className="flex items-center gap-2">
          {state === "idle" && (
            <button
              onClick={startTimer}
              className={`px-3 py-1 rounded text-white text-sm font-medium ${modeInfo.color} hover:opacity-90 transition-opacity flex items-center gap-1`}
            >
              <FaPlay className="w-3 h-3" />
              Start
            </button>
          )}
          
          {state === "running" && (
            <>
              <button
                onClick={pauseTimer}
                className="px-3 py-1 rounded bg-gray-500 text-white text-sm font-medium hover:bg-gray-600 transition-colors flex items-center gap-1"
              >
                <FaPause className="w-3 h-3" />
                Pause
              </button>
              <button
                onClick={resetTimer}
                className="px-2 py-1 rounded border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1"
              >
                <FaRedo className="w-3 h-3" />
                Reset
              </button>
            </>
          )}
          
          {state === "paused" && (
            <>
              <button
                onClick={startTimer}
                className={`px-3 py-1 rounded text-white text-sm font-medium ${modeInfo.color} hover:opacity-90 transition-opacity flex items-center gap-1`}
              >
                <FaPlay className="w-3 h-3" />
                Resume
              </button>
              <button
                onClick={resetTimer}
                className="px-2 py-1 rounded border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1"
              >
                <FaRedo className="w-3 h-3" />
                Reset
              </button>
            </>
          )}
          
          <Link
            href="/pomodoro"
            className="px-2 py-1 rounded border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1"
          >
            <FaExternalLinkAlt className="w-3 h-3" />
            Full
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-4 ${modeInfo.bgColor}`}>
      <div className="text-center mb-4">
        <h3 className={`text-lg font-semibold ${modeInfo.textColor}`}>
          {modeInfo.title}
        </h3>
        <p className="text-sm text-gray-600">
          Session {completedSessions + 1}
        </p>
      </div>
      
      <div className="text-4xl font-mono font-bold text-center mb-4">
        {timeDisplay}
      </div>
      
      <div className="flex items-center justify-center gap-3 mb-4">
        {state === "idle" && (
          <button
            onClick={startTimer}
            className={`px-4 py-2 rounded text-white font-medium ${modeInfo.color} hover:opacity-90 transition-opacity`}
          >
            Start
          </button>
        )}
        
        {state === "running" && (
          <>
            <button
              onClick={pauseTimer}
              className="px-4 py-2 rounded bg-gray-500 text-white font-medium hover:bg-gray-600 transition-colors"
            >
              Pause
            </button>
            <button
              onClick={resetTimer}
              className="px-3 py-2 rounded border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          </>
        )}
        
        {state === "paused" && (
          <>
            <button
              onClick={startTimer}
              className={`px-4 py-2 rounded text-white font-medium ${modeInfo.color} hover:opacity-90 transition-opacity`}
            >
              Resume
            </button>
            <button
              onClick={resetTimer}
              className="px-3 py-2 rounded border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          </>
        )}
      </div>
      
      <div className="text-center">
        <Link
          href="/pomodoro"
          className="text-sm text-gray-600 hover:underline"
        >
          Open full timer →
        </Link>
      </div>
    </div>
  );
}
