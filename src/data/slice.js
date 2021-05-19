import { createSlice } from '@reduxjs/toolkit';

/* eslint-disable no-param-reassign */
export const examSlice = createSlice({
  name: 'exam',
  initialState: {
    isLoading: true,
    timeIsOver: false,
    activeAttempt: null,
    exam: {},
    apiErrorMsg: '',
  },
  reducers: {
    setIsLoading: (state, { payload }) => {
      state.isLoading = payload.isLoading;
    },
    setExamState: (state, { payload }) => {
      state.exam = payload.exam;
      state.activeAttempt = payload.activeAttempt;
    },
    setActiveAttempt: (state, { payload }) => {
      state.activeAttempt = payload.activeAttempt;
      state.apiErrorMsg = '';
    },
    expireExamAttempt: (state) => {
      state.timeIsOver = true;
    },
    getExamId: (state) => state.examId,
    setApiError: (state, { payload }) => {
      state.apiErrorMsg = payload.errorMsg;
    },
  },
});

export const {
  setIsLoading, setExamState, getExamId, expireExamAttempt,
  setActiveAttempt, setApiError,
} = examSlice.actions;

export default examSlice.reducer;
