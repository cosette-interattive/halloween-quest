import { useEffect, useState } from 'react';

export default function Countdown({ until, onEnd }) {
  const [left, setLeft] = useState(() => Math.max(0, new Date(until) - Date.now()));

  useEffect(() => {
    const timer = setInterval(() => {
      const ms = Math.max(0, new Date(until) - Date.now());
      setLeft(ms);
      if (ms === 0) {
        clearInterval(timer);
        onEnd?.();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [until]);

  if (left === 0) return <p className="error">Scaduto</p>;

  const total = Math.floor(left / 1000);
  const mm = String(Math.floor(total / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  return <p className="muted">Scade tra <strong>{mm}:{ss}</strong></p>;
}
