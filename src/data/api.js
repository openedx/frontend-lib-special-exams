import { getConfig } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { ExamAction } from '../constants';

const BASE_API_URL = '/api/edx_proctoring/v1/proctored_exam/attempt';

export async function fetchExamAttemptsData(courseId, sequenceId) {
  const url = new URL(
    `${getConfig().LMS_BASE_URL}${BASE_API_URL}/course_id/${courseId}`,
  );
  if (sequenceId) {
    url.searchParams.append('content_id', sequenceId);
  }
  url.searchParams.append('is_learning_mfe', true);
  const { data } = await getAuthenticatedHttpClient().get(url.href);
  return data;
}

export async function pollExamAttempt(url) {
  const { data } = await getAuthenticatedHttpClient().get(`${getConfig().LMS_BASE_URL}${url}`);
  return data;
}

export async function createExamAttempt(examId, startClock = true, attemptProctored = false) {
  let urlString;
  if (!getConfig().EXAMS_BASE_URL) {
    urlString = `${getConfig().LMS_BASE_URL}${BASE_API_URL}`;
  } else {
    urlString = `${getConfig().EXAMS_BASE_URL}/exams/attempt`;
  }
  const url = new URL(urlString);
  const payload = {
    exam_id: examId,
    start_clock: startClock.toString(),
    attempt_proctored: attemptProctored.toString(),
  };
  const { data } = await getAuthenticatedHttpClient().post(url.href, payload);
  return data;
}

export async function updateAttemptStatus(attemptId, action, detail = null) {
  let urlString;
  if (!getConfig().EXAMS_BASE_URL) {
    urlString = `${getConfig().LMS_BASE_URL}${BASE_API_URL}/${attemptId}`;
  } else {
    urlString = `${getConfig().EXAMS_BASE_URL}/attempt/${attemptId}`;
  }
  const url = new URL(urlString);
  const payload = { action };
  if (detail) {
    payload.detail = detail;
  }
  const { data } = await getAuthenticatedHttpClient().put(url.href, payload);
  return data;
}

export async function stopAttempt(attemptId) {
  return updateAttemptStatus(attemptId, ExamAction.STOP);
}

export async function continueAttempt(attemptId) {
  return updateAttemptStatus(attemptId, ExamAction.START);
}

export async function submitAttempt(attemptId) {
  return updateAttemptStatus(attemptId, ExamAction.SUBMIT);
}

export async function resetAttempt(attemptId) {
  return updateAttemptStatus(attemptId, ExamAction.RESET);
}

export async function endExamWithFailure(attemptId, error) {
  return updateAttemptStatus(attemptId, ExamAction.ERROR, error);
}

export async function softwareDownloadAttempt(attemptId) {
  return updateAttemptStatus(attemptId, ExamAction.CLICK_DOWNLOAD_SOFTWARE);
}

export async function declineAttempt(attemptId) {
  return updateAttemptStatus(attemptId, ExamAction.DECLINE);
}

export async function fetchExamReviewPolicy(examId) {
  const url = new URL(
    `${getConfig().LMS_BASE_URL}/api/edx_proctoring/v1/proctored_exam/review_policy/exam_id/${examId}/`,
  );
  const { data } = await getAuthenticatedHttpClient().get(url.href);
  return data;
}

export async function fetchProctoringSettings(examId) {
  const url = new URL(`${getConfig().LMS_BASE_URL}/api/edx_proctoring/v1/proctored_exam/settings/exam_id/${examId}/`);
  const { data } = await getAuthenticatedHttpClient().get(url.href);
  return data;
}
