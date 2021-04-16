import { createSlice } from '@reduxjs/toolkit'

export const examSlice = createSlice({
  name: 'exam',
  initialState: {
    examId: null,
    isLoading: true,
    examDuration: null,
    attempt: {},
    examStarted: false,
  },
  reducers: {
    setIsLoading: (state, { payload }) => {
      state.isLoading = payload.isLoading;
    },
    setExamStarted: (state, { payload }) => {
      state.examStarted = payload.examStarted;
    },
    setAttempt: (state, { payload }) => {
      state.attempt = payload.attempt;
    },
    updateExam: (state, { payload }) => {
      state.examId = payload.examId;
      state.examDuration = payload.examDuration;
    },
    getExamId: (state) => {
      return state.examId;
    },
  },
});

export const {
  setIsLoading, setExamStarted, setAttempt, updateExam,
  getExamId,
} = examSlice.actions;

export default examSlice.reducer;
