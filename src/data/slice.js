import { createSlice } from '@reduxjs/toolkit';

/* eslint-disable no-param-reassign */
export const examSlice = createSlice({
  name: 'exam',
  initialState: {
    isLoading: true,
    timeIsOver: false,
    activeAttempt: null,
    proctoringSettings: {},
    exam: {},
    verification: {},
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
      const examAttempt = state.exam.attempt;
      if (examAttempt && examAttempt.attempt_id === payload.activeAttempt.attempt_id) {
        state.exam.attempt = payload.activeAttempt;
      }
    },
    setProctoringSettings: (state, { payload }) => {
      state.proctoringSettings = payload.proctoringSettings;
    },
    expireExamAttempt: (state) => {
      state.timeIsOver = true;
    },
    getExamId: (state) => state.examId,
    setVerificationData: (state, { payload }) => {
      state.verification = payload.verification;
    },
    setReviewPolicy: (state, { payload }) => {
      state.exam.reviewPolicy = payload.policy;
    },
  },
});

export const {
  setIsLoading, setExamState, getExamId, expireExamAttempt,
  setActiveAttempt, setProctoringSettings, setVerificationData, setReviewPolicy,
} = examSlice.actions;

export default examSlice.reducer;
