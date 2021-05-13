import { configureStore } from '@reduxjs/toolkit';
import examReducer from './slice';

export default configureStore({
  reducer: {
    examState: examReducer,
  },
});
