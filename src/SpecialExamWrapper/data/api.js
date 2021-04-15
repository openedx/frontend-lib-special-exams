import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { getConfig } from '@edx/frontend-platform';

export async function fetchExamData(courseId, content_id){
  const url = new URL(
    `${getConfig().LMS_BASE_URL}/api/edx_proctoring/v1/proctored_exam/exam/course_id/${courseId}/content_id/${content_id}`
  );
  const { data } = await getAuthenticatedHttpClient().get(url.href);
  return data
};

export async function fetchUserAtemptsData(userId, courseId){
  const url = new URL(
    `${getConfig().LMS_BASE_URL}/api/edx_proctoring/v1/proctored_exam/active_exams_for_user?user_id=${userId}&course_id=${encodeURIComponent(courseId)}`
  );
  const { data } = await getAuthenticatedHttpClient().get(url.href);
  return data
};

export async function postAttempt(examId) {
  const url = new URL(`${getConfig().LMS_BASE_URL}/api/edx_proctoring/v1/proctored_exam/attempt`);
  const { data } = await getAuthenticatedHttpClient().post(
    url.href,
    {
      exam_id: examId,
      start_clock: 'true',
    },
  );
  return data
};
