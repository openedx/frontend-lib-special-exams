import { logError } from '@edx/frontend-platform/logging';
import {
  fetchExamData,
  fetchUserAtemptsData,
  postAttempt,
} from './api';
import {
  setExamStarted,
  setIsLoading,
  fetchAttempt,
  fetchExam,
} from './slice';

export function getExamData(courseId, contentId) {
  return async (dispatch) => {
    dispatch(setIsLoading({isLoading: true}));
    const data = await fetchExamData(courseId, contentId);
    dispatch(setIsLoading({isLoading: false}));
    dispatch(
      fetchExam({
        examId: data.id,
        examDuration: data.time_limit_mins,
      })
    );
  };
}

export function getAttemptData(userId, courseId) {
  return async (dispatch) => {
    dispatch(setIsLoading({isLoading: true}));
    const data = await fetchUserAtemptsData(userId, courseId);
    dispatch(setIsLoading({isLoading: false}));
    if (Object.keys(data).length > 0) {
      const attemptData = data[0];
      dispatch(
        fetchAttempt({
          attempt: attemptData.attempt,
        })
      );
      dispatch(
        setExamStarted({
          examStarted: attemptData.attempt.status === 'started'
        })
      );
    }
  };
}

export function startExam(examId) {
  return async (dispatch) => {
    const data = await postAttempt(examId);
    if (data && data.exam_attempt_id) {
      dispatch(
        setExamStarted({
          examStarted: true,
        })
      );
    }
  };
}