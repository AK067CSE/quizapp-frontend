import React, { createContext, useContext, useReducer, useEffect } from 'react';

const QuizContext = createContext();

const initialState = {
  quizId: null,
  email: '',
  questions: [],
  currentQuestion: 0,
  answers: {},         // { [qIndex]: answer (string or array) }
  visitedQuestions: new Set(),
  attemptedQuestions: new Set(),
  bookmarkedQuestions: new Set(),
  reviewLaterQuestions: new Set(),
  notes: {},           // { [questionIndex]: string }
  hintUsed: new Set(),
  timeSpentPerQuestion: {}, // { [questionIndex]: seconds }
  timeRemaining: 30 * 60,
  quizStarted: false,
  quizCompleted: false,
  quizResults: null,
  loading: false,
  error: null
};

const quizReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'START_QUIZ':
      return {
        ...state,
        quizId: action.payload.quiz_id,
        email: action.payload.email,
        questions: action.payload.questions,
        quizStarted: true,
        loading: false,
        error: null
      };
    case 'SET_CURRENT_QUESTION': {
      const newVisited = new Set(state.visitedQuestions);
      newVisited.add(action.payload);
      return {
        ...state,
        currentQuestion: action.payload,
        visitedQuestions: newVisited
      };
    }
    case 'SET_ANSWER': {
      const newAttempted = new Set(state.attemptedQuestions);
      newAttempted.add(state.currentQuestion);
      return {
        ...state,
        answers: {
          ...state.answers,
          [state.currentQuestion]: action.payload
        },
        attemptedQuestions: newAttempted
      };
    }
    case 'UPDATE_TIMER':
      return { ...state, timeRemaining: action.payload };
    case 'COMPLETE_QUIZ':
      return {
        ...state,
        quizCompleted: true,
        quizResults: action.payload
      };
    case 'RESET_QUIZ':
      return initialState;
    case 'TOGGLE_BOOKMARK': {
      const idx = action.payload;
      const set = new Set(state.bookmarkedQuestions);
      if (set.has(idx)) set.delete(idx); else set.add(idx);
      return { ...state, bookmarkedQuestions: set };
    }
    case 'TOGGLE_REVIEW_LATER': {
      const idx = action.payload;
      const set = new Set(state.reviewLaterQuestions);
      if (set.has(idx)) set.delete(idx); else set.add(idx);
      return { ...state, reviewLaterQuestions: set };
    }
    case 'SET_NOTE': {
      const { index, text } = action.payload;
      return { ...state, notes: { ...state.notes, [index]: text } };
    }
    case 'INCREMENT_TIME': {
      const idx = action.payload;
      const prev = state.timeSpentPerQuestion[idx] || 0;
      return { ...state, timeSpentPerQuestion: { ...state.timeSpentPerQuestion, [idx]: prev + 1 } };
    }
    case 'SET_HINT_USED': {
      const idx = action.payload;
      const set = new Set(state.hintUsed);
      set.add(idx);
      return { ...state, hintUsed: set };
    }
    case 'LOAD_PERSISTED': {
      const { bookmarked = [], reviewLater = [], notes = {}, timeSpent = {} } = action.payload || {};
      return {
        ...state,
        bookmarkedQuestions: new Set(bookmarked),
        reviewLaterQuestions: new Set(reviewLater),
        notes: notes,
        timeSpentPerQuestion: timeSpent
      };
    }
    default:
      return state;
  }
};

export const QuizProvider = ({ children }) => {
  const [state, dispatch] = useReducer(quizReducer, initialState);

  // Hydrate persisted state for this quiz
  useEffect(() => {
    if (!state.quizId) return;
    try {
      const b = localStorage.getItem(`bookmarks:${state.quizId}`);
      const r = localStorage.getItem(`reviewLater:${state.quizId}`);
      const n = localStorage.getItem(`notes:${state.quizId}`);
      const t = localStorage.getItem(`timeSpent:${state.quizId}`);
      dispatch({
        type: 'LOAD_PERSISTED',
        payload: {
          bookmarked: b ? JSON.parse(b) : [],
          reviewLater: r ? JSON.parse(r) : [],
          notes: n ? JSON.parse(n) : {},
          timeSpent: t ? JSON.parse(t) : {}
        }
      });
    } catch (e) {
      console.warn('Failed to load persisted quiz state', e);
    }
  }, [state.quizId]);

  // Persist changes
  useEffect(() => {
    if (!state.quizId) return;
    try {
      localStorage.setItem(`bookmarks:${state.quizId}`, JSON.stringify(Array.from(state.bookmarkedQuestions)));
      localStorage.setItem(`reviewLater:${state.quizId}`, JSON.stringify(Array.from(state.reviewLaterQuestions)));
      localStorage.setItem(`notes:${state.quizId}`, JSON.stringify(state.notes));
      localStorage.setItem(`timeSpent:${state.quizId}`, JSON.stringify(state.timeSpentPerQuestion));
    } catch (e) {
      console.warn('Failed to persist quiz state', e);
    }
  }, [state.quizId, state.bookmarkedQuestions, state.reviewLaterQuestions, state.notes, state.timeSpentPerQuestion]);

  return (
    <QuizContext.Provider value={{ state, dispatch }}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};
