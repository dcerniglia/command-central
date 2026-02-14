import { useEffect, useRef } from 'react';
import { DailyStats } from '../api/client';

function notify(title: string, body: string) {
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
  }
}

export function useNotifications(getStats: () => DailyStats | null) {
  const lastActivity = useRef(Date.now());

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Track user activity
  useEffect(() => {
    const handler = () => { lastActivity.current = Date.now(); };
    window.addEventListener('mousemove', handler);
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('mousemove', handler);
      window.removeEventListener('keydown', handler);
    };
  }, []);

  // Periodic check every 5 minutes
  useEffect(() => {
    const id = setInterval(() => {
      const idleMinutes = (Date.now() - lastActivity.current) / 60000;
      if (idleMinutes > 15) {
        notify('Command Central', 'You have been idle for over 15 minutes. Timer still running?');
      }

      const stats = getStats();
      if (!stats) return;

      if (stats.minutesLogged === 0) {
        notify('Command Central', 'No time logged today yet. Start tracking!');
      }
      if (stats.tasksDueToday > 0) {
        notify('Command Central', `You have ${stats.tasksDueToday} task(s) due today.`);
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(id);
  }, [getStats]);
}
