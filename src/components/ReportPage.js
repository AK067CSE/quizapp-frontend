import React, { useEffect, useState, useMemo } from 'react';
import { useQuiz } from '../context/QuizContext';
import { quizAPI } from '../utils/api';
import DOMPurify from 'dompurify';

const ReportPage = ({ onRestart }) => {
  const { state } = useQuiz();
  const { quizId } = state;

  const [detailedResults, setDetailedResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Difficulties list (static)
  const difficulties = useMemo(() => ['easy', 'medium', 'hard'], []);
  
  // Always have a safe questions array for hooks
  const questions = detailedResults?.questions ?? [];

  // Build category list when questions change
  const categoryList = useMemo(() => {
    return Array.from(
      new Set(
        questions.map((q) => (q.category || 'General').split(':')[0])
      )
    ).sort();
  }, [questions]);

  const matrix = useMemo(() => {
    const matrix = {};
    categoryList.forEach(cat => {
      matrix[cat] = {};
      difficulties.forEach(d => {
        matrix[cat][d] = { correct: 0, total: 0 };
      });
    });
    return matrix;
  }, [categoryList, difficulties]);

  const difficultyAccuracy = useMemo(() => {
    return difficulties.reduce((acc, d) => {
      let corr = 0, tot = 0;
      categoryList.forEach(cat => {
        corr += matrix[cat][d].correct;
        tot += matrix[cat][d].total;
      });
      acc[d] = tot ? Math.round((corr / tot) * 100) : 0;
      return acc;
    }, {});
  }, [categoryList, matrix, difficulties]);

  const categoryAccuracy = useMemo(() => {
    return categoryList.map(cat => {
      let corr = 0, tot = 0;
      difficulties.forEach(d => {
        corr += matrix[cat][d].correct;
        tot += matrix[cat][d].total;
      });
      return { category: cat, pct: tot ? Math.round((corr / tot) * 100) : 0 };
    }).sort((a, b) => b.pct - a.pct);
  }, [categoryList, matrix, difficulties]);

  // Effect hook to fetch data from API
  useEffect(() => {
    const fetchDetailedResults = async () => {
      try {
        const response = await quizAPI.getResults(quizId);
        if (response.success) {
          setDetailedResults(response.quiz);
        } else {
          setError('Failed to load results. Please try again later.');
        }
      } catch (error) {
        console.error('Error fetching detailed results:', error);
        setError('An error occurred while fetching results.');
      } finally {
        setLoading(false);
      }
    };

    if (quizId) {
      fetchDetailedResults();
    }
  }, [quizId]);

  // Return early if loading or error
  if (loading) {
    return <div className="loading">Loading results...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!detailedResults) {
    return <div className="error">Failed to load results</div>;
  }

  // Process detailed results for display
  const { score, total_questions, time_taken, email } = detailedResults;
  const percentage = Math.round((score / total_questions) * 100);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreClass = () => {
    if (percentage >= 80) return 'excellent';
    if (percentage >= 60) return 'good';
    if (percentage >= 40) return 'average';
    return 'poor';
  };

  let totalHints = 0;
  let totalTime = 0;
  let timeCount = 0;

  questions.forEach(q => {
    const diff = (q.difficulty || '').toLowerCase();
    const cat = (q.category || 'General').split(':')[0];
    if (matrix[cat] && matrix[cat][diff]) {
      matrix[cat][diff].total += 1;
      if (q.is_correct) matrix[cat][diff].correct += 1;
    }
    if (q.hint_used) totalHints += 1;
    if (typeof q.time_spent === 'number' && q.time_spent > 0) {
      totalTime += q.time_spent;
      timeCount += 1;
    }
  });

  const avgTime = timeCount ? Math.round(totalTime / timeCount) : 0;

  const heatColor = (pct) => {
    const hue = Math.round((pct / 100) * 120); // 0 red -> 120 green
    return `hsl(${hue}, 80%, 45%)`;
  };

  const textOn = (pct) => pct > 60 ? '#0b1f18' : '#ffffff';

  return (
    <div className="report-page">
      <div className="report-container glassmorphism-card" style={{ padding: '24px', color: 'rgba(255,255,255,0.95)' }}>
        {/* Header */}
        <div className="report-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '12px', marginBottom: '18px' }}>
          <h1 style={{ color: '#EFFFFA', textShadow: '0 2px 12px rgba(0,0,0,0.25)' }}>🎉 Quiz Complete!</h1>
          <div className="user-info" style={{ color: 'rgba(255,255,255,0.8)' }}>
            <p>Email: <strong style={{ color: '#fff' }}>{email}</strong></p>
          </div>
        </div>

        {/* Score and quick stats */}
        <div className="score-summary" style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 280px) 1fr', gap: '16px', alignItems: 'stretch' }}>
          {/* Big Score Card */}
          <div className={`glassmorphism-card ${getScoreClass()}`} style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <div style={{ fontSize: '44px', fontWeight: 800, lineHeight: 1, color: '#FFD1DC', textShadow: '0 3px 12px rgba(0,0,0,0.35)' }}>{percentage}%</div>
            <div style={{ marginTop: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>{score} / {total_questions}</div>
          </div>

          {/* Stat Rows as cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(160px, 1fr))', gap: '16px' }}>
            <div className="glassmorphism-card" style={{ padding: '16px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>Time Taken</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#06FFA5', textShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>{formatTime(time_taken)}</div>
            </div>
            <div className="glassmorphism-card" style={{ padding: '16px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>Correct</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#06FFA5' }}>{score}</div>
            </div>
            <div className="glassmorphism-card" style={{ padding: '16px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>Incorrect</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#FF6B6B' }}>{total_questions - score}</div>
            </div>
          </div>
        </div>

        {/* Advanced Analytics */}
        <div className="analytics-section" style={{ marginTop: '24px' }}>
          <h2 style={{ color: '#FFFFFF', textShadow: '0 2px 10px rgba(0,0,0,0.25)' }}>📈 Advanced Analytics</h2>

          <div className="top-stats" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginTop: '12px'
          }}>
            <div className="glassmorphism-card" style={{ padding: '16px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>Average Time / Question</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#06FFA5' }}>
                {avgTime ? `${Math.floor(avgTime / 60)}m ${avgTime % 60}s` : '—'}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>
                {timeCount ? `${timeCount} tracked` : 'no time data'}
              </div>
            </div>

            <div className="glassmorphism-card" style={{ padding: '16px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>Hints Used</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#FFD93D' }}>{totalHints}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>across all questions</div>
            </div>

            <div className="glassmorphism-card" style={{ padding: '16px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>Accuracy by Difficulty</div>
              <div style={{ marginTop: '8px', display: 'grid', gap: '8px' }}>
                {difficulties.map(d => (
                  <div key={d} style={{ display: 'grid', gridTemplateColumns: '84px 1fr 48px', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: `hsl(${(difficultyAccuracy[d] / 100) * 120}, 80%, 45%)` }}>{d}</span>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: `linear-gradient(to right, rgba(0,255,0,0.25) ${difficultyAccuracy[d]}%, #eee ${difficultyAccuracy[d]}%)`
                    }}></div>
                    <div style={{ fontSize: '14px', color: textOn(difficultyAccuracy[d]) }}>
                      {difficultyAccuracy[d]}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Category Accuracy */}
          <div className="category-accuracy" style={{ marginTop: '24px' }}>
            <h3 style={{ color: '#FFFFFF' }}>Category Accuracy</h3>
            <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              {categoryAccuracy.map(({ category, pct }) => (
                <div key={category} className="glassmorphism-card category-card" style={{ padding: '12px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <span className="category-name" style={{ color: '#fff' }}>{category}</span>
                  <div className="category-bar" style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.15)', borderRadius: '8px', overflow: 'hidden', marginTop: '8px' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: heatColor(pct) }} />
                  </div>
                  <div style={{ marginTop: '6px', fontWeight: 700, color: textOn(pct) }}>{pct}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions inside the card */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button onClick={onRestart} className="start-btn" style={{ padding: '10px 16px' }}>🔄 Restart Quiz</button>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
