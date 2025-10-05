import React, { useEffect } from 'react';
import { useQuiz } from '../context/QuizContext';

const Timer = ({ onTimeUp }) => {
  const { state, dispatch } = useQuiz();
  const { timeRemaining } = state;

  useEffect(() => {
    if (timeRemaining <= 0) {
      onTimeUp();
      return;
    }
    const timer = setInterval(() => {
      dispatch({ type: 'UPDATE_TIMER', payload: timeRemaining - 1 });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeRemaining, dispatch, onTimeUp]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerClass = () => {
    if (timeRemaining <= 300) return 'timer critical'; // 5 minutes
    if (timeRemaining <= 600) return 'timer warning';  // 10 minutes
    return 'timer';
  };

  const percentage = (timeRemaining / 1800) * 100;
  const circumference = 2 * Math.PI * 20;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={getTimerClass()}>
      {/* Circular Progress Indicator */}
      <svg width="40" height="40" style={{ marginRight: '8px' }}>
        <circle
          cx="20" cy="20" r="18"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="3" fill="none"
        />
        <circle
          cx="20" cy="20" r="18"
          stroke="currentColor" strokeWidth="3"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 20 20)"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <span className="timer-icon">⏰</span>
      <span className="timer-text">{formatTime(timeRemaining)}</span>
    </div>
  );
};

export default Timer;
