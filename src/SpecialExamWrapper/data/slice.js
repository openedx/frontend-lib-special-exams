import { createSlice } from '@reduxjs/toolkit'

export const examSlice = createSlice({
  name: 'exam',
  initialState: {
    examId: null,
    isLoading: false,
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
    fetchAttempt: (state, { payload }) => {
      state.attempt = payload.attempt;
    },
    fetchExam: (state, { payload }) => {
      state.examId = payload.examId;
      state.examDuration = payload.examDuration;
    },
  },
})

// Action creators are generated for each case reducer function
export const { setIsLoading, setExamStarted, fetchAttempt, fetchExam } = examSlice.actions

export default examSlice.reducer
