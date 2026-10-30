import { useEffect, useState } from 'react';
import { api } from './api.js';
import { supabase } from './supabase.js';

export function useLeaderboard() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = () => {
      api
        .leaderboard()
        .then((data) => {
          if (!active) return;
          setRows(data);
          setError('');
        })
        .catch((e) => active && setError(e.message));
    };

    load();
    if (!supabase) return undefined;

    const channel = supabase
      .channel('leaderboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, load)
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { rows, error };
}
