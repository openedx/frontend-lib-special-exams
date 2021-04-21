import { getConfig } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';

export async function fetchExamData(courseId, contentId) {
  const url = new URL(
    `${getConfig().LMS_BASE_URL}/api/edx_proctoring/v1/proctored_exam/exam/course_id/${courseId}/content_id/${contentId}`,
  );
  const { data } = await getAuthenticatedHttpClient().get(url.href);
  return data;
}

export async function fetchUserAtemptsData(userId, courseId) {
  const url = new URL(
    `${getConfig().LMS_BASE_URL}/api/edx_proctoring/v1/proctored_exam/active_exams_for_user?user_id=${userId}&course_id=${encodeURIComponent(courseId)}`,
  );
  const { data } = await getAuthenticatedHttpClient().get(url.href);
  return data;
}

export async function updateAttempt(examId) {
  const url = new URL(`${getConfig().LMS_BASE_URL}/api/edx_proctoring/v1/proctored_exam/attempt`);
  const payload = {
    exam_id: examId,
    start_clock: 'true',
  };
  const { data } = await getAuthenticatedHttpClient().post(url.href, payload);
  return data;
}
