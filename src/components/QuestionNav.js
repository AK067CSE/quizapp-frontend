import React, { useState, useMemo } from 'react';
import { useQuiz } from '../context/QuizContext';

const QuestionNav = ({ onQuestionSelect }) => {
  const { state } = useQuiz();
  const { questions, currentQuestion, visitedQuestions, attemptedQuestions, bookmarkedQuestions, reviewLaterQuestions } = state;

  const getStatus = (i) => (attemptedQuestions.has(i) ? 'attempted' : visitedQuestions.has(i) ? 'visited' : 'unvisited');

  // Filters
  const [filter, setFilter] = useState('all');
  const filtered = useMemo(() => {
    const all = Array.from({ length: questions.length }, (_, i) => i);
    switch (filter) {
      case 'answered': return all.filter(i => attemptedQuestions.has(i));
      case 'unanswered': return all.filter(i => !attemptedQuestions.has(i));
      case 'visited': return all.filter(i => visitedQuestions.has(i));
      case 'bookmarked': return all.filter(i => bookmarkedQuestions.has(i));
      case 'review': return all.filter(i => reviewLaterQuestions.has(i));
      default: return all;
    }
  }, [filter, questions.length, attemptedQuestions, visitedQuestions, bookmarkedQuestions, reviewLaterQuestions]);

  const heatClass = (i) => {
    const diff = (questions[i]?.difficulty || '').toLowerCase();
    const diffClass = diff === 'easy' ? 'diff-easy' : diff === 'medium' ? 'diff-medium' : diff === 'hard' ? 'diff-hard' : 'diff-unknown';
    const status = getStatus(i);
    const active = i === currentQuestion ? 'active' : '';
    const isBookmarked = bookmarkedQuestions.has(i) ? 'flag-bookmarked' : '';
    const isReview = reviewLaterQuestions.has(i) ? 'flag-review' : '';
    return `heatmap-cell ${diffClass} status-${status} ${isBookmarked} ${isReview} ${active}`;
  };

  const progressPercentage = questions.length ? (attemptedQuestions.size / questions.length) * 100 : 0;

  return (
    <div className="question-nav">
      <div className="nav-header">
        <h3>📋 Question Overview</h3>
        <div className="nav-legend">
          <div className="legend-item"><span className="legend-dot attempted"></span><span>Answered</span></div>
          <div className="legend-item"><span className="legend-dot visited"></span><span>Visited</span></div>
          <div className="legend-item"><span className="legend-dot unvisited"></span><span>Not Visited</span></div>
          <div className="legend-item"><span>⭐</span><span>Bookmarked</span></div>
          <div className="legend-item"><span>🚩</span><span>Review</span></div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
          {[
            { key: 'all', label: 'All' },
            { key: 'answered', label: 'Answered' },
            { key: 'unanswered', label: 'Unanswered' },
            { key: 'visited', label: 'Visited' },
            { key: 'bookmarked', label: 'Bookmarked' },
            { key: 'review', label: 'Review' }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`nav-btn ${filter === f.key ? 'selected' : ''}`}
              style={{ padding: '6px 10px' }}
              aria-pressed={filter === f.key}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="heatmap-grid">
        {filtered.map((i) => (
          <button
            key={i}
            className={heatClass(i)}
            onClick={() => onQuestionSelect(i)}
            title={`Go to Q${i + 1}`}
            aria-label={`Question ${i + 1}`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div className="nav-stats">
        <div className="stat-item"><span className="stat-number">{attemptedQuestions.size}</span><span className="stat-label">Answered</span></div>
        <div className="stat-item"><span className="stat-number">{visitedQuestions.size}</span><span className="stat-label">Visited</span></div>
        <div className="stat-item"><span className="stat-number">{questions.length - visitedQuestions.size}</span><span className="stat-label">Remaining</span></div>
      </div>

      {/* Overall Progress Bar */}
      <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>
          <span>Overall Progress</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${progressPercentage}%`, height: '100%', background: 'linear-gradient(90deg, #06FFA5, #00D4FF)', transition: 'width 0.3s ease', borderRadius: '4px' }} />
        </div>
      </div>
    </div>
  );
};

export default QuestionNav;
