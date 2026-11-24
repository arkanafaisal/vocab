const STORAGE_KEY = 'vocab_guest_state';

const ADJECTIVES = ['Swift', 'Neon', 'Brave', 'Pixel', 'Silent', 'Clever', 'Cosmic', 'Rapid', 'Lucky', 'Turbo'];
const NOUNS = ['Fox', 'Owl', 'Wolf', 'Lynx', 'Hawk', 'Panda', 'Tiger', 'Falcon', 'Bear', 'Viper'];

function generateGuestName() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(10 + Math.random() * 90);
  return `${adj}${noun}${num}`;
}

export function getGuestState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.username) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Guest state read error:', err.message);
  }

  const initial = {
    username: generateGuestName(),
    score: 0,
    streak: 0,
    currentIndex: 0,
    questions: []
  };
  saveGuestState(initial);
  return initial;
}

export function saveGuestState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Guest state save error:', err.message);
  }
}

export function evaluateGuestAnswer(choice) {
  const state = getGuestState();
  const question = state.questions[state.currentIndex];
  if (!question) return null;

  const correctAnswer = question.choices[question.answerIndex];
  const isCorrect = correctAnswer === choice;

  let newStreak = 0;
  let increment = 0;
  if (isCorrect) {
    newStreak = state.streak + 1;
    increment = 10;
    if (newStreak > 9) increment = 50;
    else if (newStreak > 4) increment = 25;
    else if (newStreak > 2) increment = 15;
  }

  state.streak = newStreak;
  state.score += increment;
  state.currentIndex += 1;
  saveGuestState(state);

  return {
    correct: isCorrect,
    correctAnswer,
    streak: newStreak,
    points_added: increment
  };
}

export function getGuestQuestionFormatted(state) {
  const q = state.questions[state.currentIndex];
  if (!q) return null;
  return {
    index: state.currentIndex,
    vocab: q.vocab,
    choices: q.choices
  };
}

export async function ensureGuestQuizCached(fetchBatchFn) {
  const state = getGuestState();
  if (!state.questions || state.questions.length === 0 || state.currentIndex >= state.questions.length) {
    const res = await fetchBatchFn();
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      state.questions = res.data;
      state.currentIndex = 0;
      saveGuestState(state);
    } else if (state.questions && state.questions.length > 0 && state.currentIndex >= state.questions.length) {
      state.currentIndex = 0;
      saveGuestState(state);
    }
  }
  return state;
}

export async function loadNextGuestQuestion(fetchBatchFn) {
  const state = await ensureGuestQuizCached(fetchBatchFn);
  return { state, question: getGuestQuestionFormatted(state) };
}
