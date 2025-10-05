import React, { useEffect, useState } from 'react';
import { useQuiz } from '../context/QuizContext';
import { quizAPI } from '../utils/api';
import Timer from './Timer';
import QuestionNav from './QuestionNav';
import EnhancedQuestionCard from './EnhancedQuestionCard';

const QuizPage = ({ onComplete }) => {
  const { state, dispatch } = useQuiz();
  const { 
    quizId, 
    questions, 
    currentQuestion, 
    answers, 
    timeRemaining,
    bookmarkedQuestions,
    reviewLaterQuestions,
    notes,
    hintUsed,
    quizCompleted
  } = state;

  const isBookmarked = bookmarkedQuestions.has(currentQuestion);
  const isReviewLater = reviewLaterQuestions.has(currentQuestion);
  const currentNote = notes[currentQuestion] || '';
  const [showHint, setShowHint] = useState(false);

  // Difficulty-based hint text (for display)
  const getHintForDifficulty = (difficulty) => {
    const d = (difficulty || '').toLowerCase();
    if (d === 'easy') return 'Think of the most straightforward definition or obvious choice.';
    if (d === 'medium') return 'Consider related concepts and eliminate unlikely options.';
    if (d === 'hard') return 'Break the problem down and watch for subtle distinctions.';
    return 'Review the question carefully and rule out distractors.';
  };

  // Mark current question as visited on mount and question change
  useEffect(() => {
    if (questions.length > 0) {
      handleQuestionVisit(currentQuestion);
    }
  }, [currentQuestion, questions.length]);

  // Per-question time tracking (increment every second)
  useEffect(() => {
    if (timeRemaining <= 0 || quizCompleted) return;
    const interval = setInterval(() => {
      dispatch({ type: 'INCREMENT_TIME', payload: currentQuestion });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentQuestion, timeRemaining, quizCompleted, dispatch]);

  const handleQuestionVisit = async (questionIndex) => {
    try {
      dispatch({ type: 'MARK_VISITED', payload: questionIndex });
      await quizAPI.updateQuestion(quizId, questionIndex, { visited: true });
    } catch (error) {
      console.error('Error updating question visit:', error);
    }
  };

  const handleAnswerSelect = async (answer) => {
    // Update local state
    dispatch({ type: 'SET_ANSWER', payload: answer });

    try {
      // Update server: user_answer, and mark attempted/visited
      await quizAPI.updateQuestion(quizId, currentQuestion, { 
        user_answer: answer,
        attempted: true,
        visited: true
      });
      // (MARK_ATTEMPTED not needed: SET_ANSWER action handles it)
    } catch (error) {
      console.error('Error updating answer:', error);
    }
  };

  const handleQuestionNavigation = (questionIndex) => {
    dispatch({ type: 'SET_CURRENT_QUESTION', payload: questionIndex });
  };

  const handleNextQuestion = async () => {
    if (currentQuestion < questions.length - 1) {
      // Save time spent on current question to server
      try {
        const time = state.timeSpentPerQuestion[currentQuestion] || 0;
        await quizAPI.updateQuestion(quizId, currentQuestion, { time_spent: time });
      } catch (error) {
        console.error('Error updating time spent:', error);
      }
      dispatch({ type: 'SET_CURRENT_QUESTION', payload: currentQuestion + 1 });
    }
  };

  const handlePreviousQuestion = async () => {
    if (currentQuestion > 0) {
      try {
        const time = state.timeSpentPerQuestion[currentQuestion] || 0;
        await quizAPI.updateQuestion(quizId, currentQuestion, { time_spent: time });
      } catch (error) {
        console.error('Error updating time spent:', error);
      }
      dispatch({ type: 'SET_CURRENT_QUESTION', payload: currentQuestion - 1 });
    }
  };

  const handleSubmitQuiz = async () => {
    try {
      // Update time for last question
      const time = state.timeSpentPerQuestion[currentQuestion] || 0;
      await quizAPI.updateQuestion(quizId, currentQuestion, { time_spent: time });
      const timeTaken = (30 * 60) - timeRemaining;
      const response = await quizAPI.submitQuiz(quizId, timeTaken);
      if (response.success) {
        dispatch({ type: 'COMPLETE_QUIZ', payload: response });
        onComplete();
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

  const handleTimeUp = () => {
    handleSubmitQuiz();
  };

  if (!questions.length) {
    return <div className="loading">Loading quiz...</div>;
  }

  const currentQ = questions[currentQuestion];
  const currentAnswer = answers[currentQuestion];

  // Difficulty badge for current question
  const getDifficultyBadge = (difficulty) => {
    const badges = {
      easy: { class: 'difficulty-badge easy', text: '🟢 EASY' },
      medium: { class: 'difficulty-badge medium', text: '🟡 MEDIUM' },
      hard: { class: 'difficulty-badge hard', text: '🔴 HARD' }
    };
    return badges[(difficulty || '').toLowerCase()] || badges.easy;
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const difficultyBadge = getDifficultyBadge(currentQ.difficulty);
  const difficulty = (currentQ.difficulty || '').toLowerCase();
  const themeClass = difficulty === 'easy' ? 'easy-theme' : difficulty === 'medium' ? 'medium-theme' : difficulty === 'hard' ? 'hard-theme' : '';

  return (
    <div className={`quiz-page glassmorphism-card ${themeClass}`}>
      <div className="quiz-header">
        <Timer onTimeUp={handleTimeUp} />
        <div className="quiz-progress">
          Question {currentQuestion + 1} of {questions.length}
        </div>
      </div>

      <div className="quiz-content">
        <div className="quiz-main">
          <div className="question-container">
            {/* Question Header with Difficulty Badge */}
            <div className="question-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <h2>Question {currentQuestion + 1}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className={difficultyBadge.class} aria-hidden>
                  {difficultyBadge.text}
                </div>
                {/* Bookmark toggle */}
                <button
                  type="button"
                  aria-pressed={isBookmarked}
                  title={isBookmarked ? 'Remove bookmark' : 'Bookmark this question'}
                  onClick={() => dispatch({ type: 'TOGGLE_BOOKMARK', payload: currentQuestion })}
                  className={`nav-btn ${isBookmarked ? 'selected' : ''}`}
                  style={{ padding: '6px 10px' }}
                >
                  {isBookmarked ? '⭐ Bookmarked' : '☆ Bookmark'}
                </button>
                {/* Review later toggle */}
                <button
                  type="button"
                  aria-pressed={isReviewLater}
                  title={isReviewLater ? 'Remove review later' : 'Mark to review later'}
                  onClick={() => dispatch({ type: 'TOGGLE_REVIEW_LATER', payload: currentQuestion })}
                  className={`nav-btn ${isReviewLater ? 'selected' : ''}`}
                  style={{ padding: '6px 10px' }}
                >
                  {isReviewLater ? '🚩 Review' : '🏳️ Review'}
                </button>
                {/* Hint toggle */}
                <button
                  type="button"
                  title="Show hint"
                  onClick={async () => {
                    if (!hintUsed.has(currentQuestion)) {
                      dispatch({ type: 'SET_HINT_USED', payload: currentQuestion });
                      try {
                        await quizAPI.updateQuestion(quizId, currentQuestion, { hint_used: true });
                      } catch (err) {
                        console.error('Error updating hint usage:', err);
                      }
                    }
                    setShowHint(v => !v);
                  }}
                  className={`nav-btn ${showHint ? 'selected' : ''}`}
                  style={{ padding: '6px 10px' }}
                >
                  💡 Hint
                </button>
              </div>
            </div>

            {/* Contextual Hint */}
            {showHint && (
              <div className="glassmorphism-card" style={{ padding: '12px', marginBottom: '16px', borderLeft: '4px solid #FFD93D' }}>
                <div style={{ color: 'rgba(255,255,255,0.85)' }}>{getHintForDifficulty(currentQ.difficulty)}</div>
              </div>
            )}

            {/* Progress bar */}
            <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '4px', marginBottom: '24px', overflow: 'hidden' }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #00D4FF, #06FFA5)',
                transition: 'width 0.3s ease',
                borderRadius: '4px'
              }} />
            </div>

            {/* Question Card */}
            <EnhancedQuestionCard
              question={currentQ}
              questionNumber={currentQuestion + 1}
              totalQuestions={questions.length}
              onAnswerSelect={handleAnswerSelect}
              selectedAnswer={currentAnswer || null}
            />

            {/* Notes */}
            <div className="glassmorphism-card" style={{ padding: '12px', marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <strong style={{ color: 'rgba(255,255,255,0.9)' }}>📝 Notes</strong>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>Auto-saved for this question</span>
              </div>
              <textarea
                value={currentNote}
                onChange={(e) => dispatch({ type: 'SET_NOTE', payload: { index: currentQuestion, text: e.target.value } })}
                placeholder="Write a quick note..."
                style={{ width: '100%', minHeight: '80px', borderRadius: '8px', padding: '10px', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
              />
            </div>

            {/* Navigation buttons */}
            <div className="question-navigation" style={{ marginTop: 12 }}>
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestion === 0}
                className="nav-btn prev-btn"
              >
                ← Previous
              </button>
              {currentQuestion === questions.length - 1 ? (
                <button onClick={handleSubmitQuiz} className="nav-btn submit-btn">
                  Submit Quiz 🏁
                </button>
              ) : (
                <button onClick={handleNextQuestion} className="nav-btn next-btn">
                  Next →
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="quiz-sidebar">
          <QuestionNav onQuestionSelect={handleQuestionNavigation} />
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
