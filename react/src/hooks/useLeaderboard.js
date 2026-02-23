import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [lbStatus, setLbStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'cooldown'
  const [lbCooldown, setLbCooldown] = useState(0);

  const fetchLeaderboardData = useCallback(async () => {
    setLbStatus('loading');
    const res = await api.getLeaderboard();
    
    if (res.success && Array.isArray(res.data)) {
      setLeaderboard(res.data);
    }
    
    setLbStatus('success');
    setTimeout(() => {
      setLbCooldown(5);
      setLbStatus('cooldown');
    }, 1000);
  }, [api]);

  // Pindahkan juga efek cooldown ke sini agar App.jsx bersih!
  useEffect(() => {
    if (lbStatus === 'cooldown' && lbCooldown > 0) {
      const timer = setTimeout(() => setLbCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (lbStatus === 'cooldown' && lbCooldown === 0) {
      setLbStatus('idle');
    }
  }, [lbStatus, lbCooldown]);

  return { leaderboard, lbStatus, lbCooldown, fetchLeaderboardData };
}