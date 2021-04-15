import { configureStore } from '@reduxjs/toolkit';
import examReducer from './slice';

export default function initializeStore() {
  // console.log('initializeStore');
  // console.log(examReducer);
  return configureStore({
    reducer: {
      exam: examReducer,
    },
  });
}
