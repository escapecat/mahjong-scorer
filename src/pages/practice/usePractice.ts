import { useState, useCallback, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { generateQuestion, type PracticeQuestion } from './handGenerator';

const STREAK_KEY = 'mahjong-practice-streak';
const BEST_KEY = 'mahjong-practice-best-streak';

interface PersistedStats {
  streak: number;
  best: number;
}

function loadStats(): PersistedStats {
  try {
    const streak = parseInt(Taro.getStorageSync(STREAK_KEY) || '0', 10) || 0;
    const best = parseInt(Taro.getStorageSync(BEST_KEY) || '0', 10) || 0;
    return { streak, best };
  } catch {
    return { streak: 0, best: 0 };
  }
}

function saveStats(stats: PersistedStats): void {
  try {
    Taro.setStorageSync(STREAK_KEY, String(stats.streak));
    Taro.setStorageSync(BEST_KEY, String(stats.best));
  } catch {
    // ignore
  }
}

export function usePractice() {
  const [question, setQuestion] = useState<PracticeQuestion | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);

  // Load stats and first question on mount
  useEffect(() => {
    const stats = loadStats();
    setStreak(stats.streak);
    setBest(stats.best);
    setQuestion(generateQuestion());
  }, []);

  const toggleSelected = useCallback((name: string) => {
    if (submitted) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, [submitted]);

  const submit = useCallback(() => {
    if (submitted || !question) return;

    // Correct iff selection exactly equals correctFanNames
    const correct = selected.size === question.correctFanNames.size
      && [...selected].every(n => question.correctFanNames.has(n));

    setSubmitted(true);

    if (correct) {
      const newStreak = streak + 1;
      const newBest = Math.max(best, newStreak);
      setStreak(newStreak);
      setBest(newBest);
      saveStats({ streak: newStreak, best: newBest });
    } else {
      setStreak(0);
      saveStats({ streak: 0, best });
    }
  }, [submitted, question, selected, streak, best]);

  const next = useCallback(() => {
    setSelected(new Set());
    setSubmitted(false);
    setQuestion(generateQuestion());
  }, []);

  const isCorrect = submitted && question
    && selected.size === question.correctFanNames.size
    && [...selected].every(n => question.correctFanNames.has(n));

  return {
    question,
    selected,
    submitted,
    isCorrect,
    streak,
    best,
    toggleSelected,
    submit,
    next,
  };
}
