import { useState, useCallback, useEffect } from 'react';
import Taro from '@tarojs/taro';

type Mode = 'fanPick' | 'fanCount' | 'waitTile';

function streakKey(mode: Mode): string {
  return `mahjong-practice-streak-${mode}`;
}
function bestKey(mode: Mode): string {
  return `mahjong-practice-best-${mode}`;
}

export function useStreak(mode: Mode) {
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);

  useEffect(() => {
    try {
      const s = parseInt(Taro.getStorageSync(streakKey(mode)) || '0', 10) || 0;
      const b = parseInt(Taro.getStorageSync(bestKey(mode)) || '0', 10) || 0;
      setStreak(s);
      setBest(b);
    } catch { /* noop */ }
  }, [mode]);

  const recordCorrect = useCallback(() => {
    setStreak(prev => {
      const next = prev + 1;
      try {
        Taro.setStorageSync(streakKey(mode), String(next));
        setBest(b => {
          const nb = Math.max(b, next);
          Taro.setStorageSync(bestKey(mode), String(nb));
          return nb;
        });
      } catch { /* noop */ }
      return next;
    });
  }, [mode]);

  const recordWrong = useCallback(() => {
    setStreak(0);
    try {
      Taro.setStorageSync(streakKey(mode), '0');
    } catch { /* noop */ }
  }, [mode]);

  return { streak, best, recordCorrect, recordWrong };
}
