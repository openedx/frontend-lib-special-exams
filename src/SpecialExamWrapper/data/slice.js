import { createSlice } from '@reduxjs/toolkit'

export const examSlice = createSlice({
  name: 'exam',
  initialState: {
    examId: null,
    isLoading: true,
    examDuration: null,
    attempt: {},
  },
  reducers: {
    fetchExam: (state, { payload }) => {
      state.examId = payload.examId;
      state.examDuration = payload.examDuration;
    },
    setIsLoading: (state, { payload }) => {
      console.log(payload);
      state.isLoading = payload.isLoading;
    },
    fetchAttempt: (state, { payload }) => {
      state.attempt = payload.attempt;
    }
  },
})

// Action creators are generated for each case reducer function
export const { fetchExam, setIsLoading, fetchAttempt } = examSlice.actions

export default examSlice.reducer
