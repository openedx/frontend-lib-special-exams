import { logError } from '@edx/frontend-platform/logging';
import {
  fetchExamData,
  fetchUserAtemptsData,
  updateAttempt,
} from './api';
import {
  setExamStarted,
  setIsLoading,
  setAttempt,
  updateExam,
  getExamId,
} from './slice';

export function getExamData(courseId, contentId) {
  return async (dispatch) => {
    dispatch(setIsLoading({ isLoading: true }));
    const data = await fetchExamData(courseId, contentId);
    dispatch(setIsLoading({ isLoading: false }));
    dispatch(
      updateExam({
        examId: data.id,
        examDuration: data.time_limit_mins,
      }),
    );
  };
}

export function getAttemptData(userId, courseId) {
  return async (dispatch) => {
    dispatch(setIsLoading({ isLoading: true }));
    const data = await fetchUserAtemptsData(userId, courseId);
    dispatch(setIsLoading({ isLoading: false }));
    if (Object.keys(data).length > 0) {
      const attemptData = data[0];
      dispatch(setAttempt({ attempt: attemptData.attempt }));
      dispatch(setExamStarted({
        examStarted: attemptData.attempt.status === 'started',
      }));
    }
  };
}

export function startExam() {
  return async (dispatch, getState) => {
    const { examId } = getState().exam;
    if (!examId) {
      logError('Failed to start exam. No exam id.');
      return;
    }
    dispatch(setIsLoading({ isLoading: true }));
    const data = await updateAttempt(examId);
    dispatch(setIsLoading({ isLoading: false }));
    if (data && data.exam_attempt_id) {
      dispatch(setExamStarted({ examStarted: true }));
    }
  };
}
