import { logError } from '@edx/frontend-platform/logging';
import {
  fetchExamData,
  fetchUserAtemptsData,
} from './api';
import {
  fetchExam,
  setIsLoading,
  fetchAttempt
} from './slice';

export function getExamData(courseId, content_id) {
  return async (dispatch) => {
    dispatch(setIsLoading({isLoading: true}));
  };
}
