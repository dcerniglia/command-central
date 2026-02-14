import { useState, useEffect, useCallback, useRef } from 'react';
import { getActiveTimer, startTimer as apiStart, stopTimer as apiStop, TimeEntry } from '../api/client';

export function useTimer() {
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const computeElapsed = useCallback((entry: TimeEntry) => {
    const started = new Date(entry.started_at + (entry.started_at.endsWith('Z') ? '' : 'Z')).getTime();
    return Math.floor((Date.now() - started) / 1000);
  }, []);

  const poll = useCallback(async () => {
    try {
      const entry = await getActiveTimer();
      setActiveTimer(entry);
      if (entry) {
        setElapsedSeconds(computeElapsed(entry));
      } else {
        setElapsedSeconds(0);
      }
    } catch {
      // ignore polling errors
    }
  }, [computeElapsed]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, [poll]);

  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (activeTimer) {
      tickRef.current = setInterval(() => {
        setElapsedSeconds(computeElapsed(activeTimer));
      }, 1000);
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [activeTimer, computeElapsed]);

  const start = useCallback(async (taskId?: string, projectId?: string) => {
    const entry = await apiStart(taskId, projectId);
    setActiveTimer(entry);
    setElapsedSeconds(0);
    return entry;
  }, []);

  const stop = useCallback(async () => {
    const entry = await apiStop();
    setActiveTimer(null);
    setElapsedSeconds(0);
    return entry;
  }, []);

  return { activeTimer, elapsedSeconds, start, stop, refresh: poll };
}
