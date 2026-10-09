import { useEffect } from 'react';
import { logError } from '@edx/frontend-platform/logging';
import { useAccessTokenQuery, useExam, useIsExam as useIsExamQuery } from './data/queries';

export const useIsExam = useIsExamQuery;

export const useExamAccessToken = () => {
  const exam = useExam();
  const query = useAccessTokenQuery(exam.id);
  useEffect(() => {
    if (query.error) {
      logError('Exam access token was not granted.');
    }
  }, [query.error]);
  return { accessToken: query.data?.exam_access_token ?? '', isPending: query.isFetching };
};
