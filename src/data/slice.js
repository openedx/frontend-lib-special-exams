import { createSlice } from '@reduxjs/toolkit';

/* eslint-disable no-param-reassign */
export const examSlice = createSlice({
  name: 'exam',
  initialState: {
    timeIsOver: false,
    apiErrorMsg: '',
  },
  reducers: {
    expireExamAttempt: (state) => {
      state.timeIsOver = true;
    },
    setApiError: (state, { payload }) => {
      state.apiErrorMsg = payload.errorMsg;
    },
  },
});

export const {
  expireExamAttempt, setApiError,
} = examSlice.actions;

export default examSlice.reducer;
