import React, { useEffect, useState } from 'react';

/**
 * Props:
 * - question: question object (fields: question, all_answers, correct_answer, difficulty, type, category, mode, etc.)
 * - questionNumber, totalQuestions
 * - onAnswerSelect(answer)
 * - selectedAnswer (string or array for multi)
 */
const EnhancedQuestionCard = ({ question, questionNumber, totalQuestions, onAnswerSelect, selectedAnswer }) => {
  const [showHint, setShowHint] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [answerFeedback, setAnswerFeedback] = useState(null);

  // State for multi-select answers
  const [selectedAnswers, setSelectedAnswers] = useState(Array.isArray(selectedAnswer) ? selectedAnswer : []);
  useEffect(() => {
    // Sync if selectedAnswer prop (from context) changes
    if (Array.isArray(selectedAnswer)) {
      setSelectedAnswers(selectedAnswer);
    }
  }, [selectedAnswer]);

  // Determine if question has multiple correct answers
  const isMulti = Array.isArray(question.correct_answer) || question.mode === 'multi';

  // Handle single-answer (radio) selection
  const handleSingleAnswer = (answer) => {
    onAnswerSelect(answer);
    if (answer === question.correct_answer) {
      setAnswerFeedback("✅ Correct");
    } else {
      setAnswerFeedback("❌ Incorrect");
    }
  };

  // Handle multi-answer (checkbox) toggle
  const handleMultiAnswer = (answer) => {
    setSelectedAnswers(prevSelected => {
      const newSelected = prevSelected.includes(answer)
        ? prevSelected.filter(a => a !== answer)
        : [...prevSelected, answer];
      onAnswerSelect(newSelected);
      // Check correctness: compare sets
      const correctSet = new Set(question.correct_answer);
      const userSet = new Set(newSelected);
      const allCorrect = (userSet.size === correctSet.size) && [...correctSet].every(a => userSet.has(a));
      setAnswerFeedback(allCorrect ? "✅ All correct" : "❌ Incorrect");
      return newSelected;
    });
  };

  // Track time spent on question
  useEffect(() => {
    const timer = setInterval(() => setTimeSpent(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const progress = ((questionNumber) / totalQuestions) * 100;

  // Difficulty color mapping (fallback to easy)
  const getDifficultyColor = (difficulty) => {
    const d = ((difficulty || 'easy') + '').toLowerCase();
    if (d === 'easy') return '#06D6A0'; // green
    if (d === 'medium') return '#FFD166'; // amber
    if (d === 'hard') return '#FF6B6B'; // red
    return '#06D6A0'; // fallback color (easy)
  };

  // Difficulty badge (text and CSS class) with safe fallback
  const difficultyBadge = (() => {
    const d = ((question.difficulty || 'easy') + '').toLowerCase();
    if (d === 'easy') return { text: 'EASY', class: 'difficulty-badge easy' };
    if (d === 'medium') return { text: 'MEDIUM', class: 'difficulty-badge medium' };
    if (d === 'hard') return { text: 'HARD', class: 'difficulty-badge hard' };
    return { text: 'EASY', class: 'difficulty-badge easy' };
  })();

  const getHintText = (difficulty) => {
    const d = (difficulty || '').toLowerCase();
    if (d === 'easy') return 'Think of the most straightforward definition or obvious choice.';
    if (d === 'medium') return 'Consider related concepts and eliminate unlikely options.';
    if (d === 'hard') return 'Break the problem down and watch for subtle distinctions.';
    return 'Review the question carefully and rule out distractors.';
  };

  // Render answer options (buttons or toggles)
  const renderOptions = () => {
    const answers = Array.isArray(question.all_answers) && question.all_answers.length
      ? question.all_answers
      : (question.type === 'boolean' ? ['True', 'False'] : [...(question.incorrect_answers || []), question.correct_answer].filter(Boolean));

    const isBoolean = (question.type || '').toLowerCase() === 'boolean';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 8 }}>
        {answers.map((answer, index) => {
          // Determine if option is selected
          const isSelected = isMulti
            ? selectedAnswers.includes(answer)
            : (selectedAnswer === answer);
          const borderColor = isSelected
            ? getDifficultyColor(question.difficulty)
            : 'rgba(255,255,255,0.12)';
          const background = isSelected
            ? `linear-gradient(135deg, ${getDifficultyColor(question.difficulty)}33, rgba(255,255,255,0.04))`
            : 'rgba(255,255,255,0.02)';
          const letter = isBoolean
            ? (answer === 'True' ? 'T' : 'F')
            : String.fromCharCode(65 + index);

          return (
            <button
              key={index}
              onClick={() => isMulti ? handleMultiAnswer(answer) : handleSingleAnswer(answer)}
              className={`answer-option ${isSelected ? 'selected' : ''}`}
              style={{
                width: '100%',
                padding: '16px 18px',
                border: `2px solid ${borderColor}`,
                background,
                backdropFilter: 'blur(6px)',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                textAlign: 'left',
                fontSize: '15px',
                borderRadius: 12
              }}
              aria-pressed={isSelected}
            >
              <span style={{
                width: 44, height: 44, borderRadius: 10,
                background: isSelected ? getDifficultyColor(question.difficulty) : 'rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 16, color: '#061826'
              }}>
                {letter}
              </span>
              <span style={{ flex: 1 }} dangerouslySetInnerHTML={{ __html: answer }} />
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="glassmorphism-card" style={{ padding: 28, maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            className={difficultyBadge.class}
            style={{
              padding: '8px 14px',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: '0.85em',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              background: getDifficultyColor(question.difficulty),
              color: '#041018'
            }}
            aria-hidden
          >
            {difficultyBadge.text}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
            Question {questionNumber} of {totalQuestions}
          </div>
        </div>
        {question.category && (
          <div style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>
            {question.category}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 6, marginBottom: 18 }}>
        <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg,#00D4FF,#06FFA5)', borderRadius: 6 }} />
      </div>

      {/* Question text */}
      <div style={{ fontSize: 18, marginBottom: 12, color: 'rgba(255,255,255,0.95)' }}>
        <div dangerouslySetInnerHTML={{ __html: question.question }} />
      </div>

      {/* Options */}
      {renderOptions()}

      {/* Answer feedback */}
      {answerFeedback && (
        <div style={{ marginTop: 12, fontSize: 15, fontWeight: 600, color: '#fff' }}>
          {answerFeedback}
        </div>
      )}

      {/* Hint */}
      <div style={{ marginTop: 18 }}>
        <button
          onClick={() => setShowHint(v => !v)}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            background: 'rgba(255,217,61,0.08)',
            border: '1px solid rgba(255,217,61,0.22)',
            color: '#FFD93D',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          💡 {showHint ? 'Hide Hint' : 'Show Hint'}
        </button>
        {showHint && (
          <div style={{ marginTop: 12, padding: 14, borderRadius: 10, background: 'rgba(255,217,61,0.06)', border: '1px solid rgba(255,217,61,0.14)' }}>
            {getHintText(question.difficulty)}
          </div>
        )}
      </div>

      {/* Time spent */}
      <div style={{ marginTop: 16, textAlign: 'center', color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>
        ⏱️ Time on this question: {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
      </div>
    </div>
  );
};

export default EnhancedQuestionCard;
