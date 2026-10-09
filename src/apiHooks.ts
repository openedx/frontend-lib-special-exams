import { useEffect } from 'react';
import { useAccessTokenQuery, useExam, useIsExam as useIsExamQuery } from './data/queries';
import { useSpecialExams } from './core/SpecialExamsProvider';

export const useIsExam = useIsExamQuery;

export const useExamAccessToken = () => {
  const exam = useExam();
  const { logError } = useSpecialExams();
  const query = useAccessTokenQuery(exam.id);
  useEffect(() => {
    if (query.error) {
      logError('Exam access token was not granted.');
    }
  }, [query.error, logError]);
  return { accessToken: query.data?.exam_access_token ?? '', isPending: query.isFetching };
};
