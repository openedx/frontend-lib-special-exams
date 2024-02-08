import { useDispatch, useSelector } from 'react-redux';
import { examRequiresAccessToken } from './data';

export const useIsExam = () => {
  const { exam } = useSelector(state => state.specialExams);

  return !!exam?.id;
};

export const useExamAccessToken = () => {
  const { exam, examAccessToken } = useSelector(state => state.specialExams);

  if (!exam) {
    return '';
  }

  return examAccessToken.exam_access_token;
};

export const useFetchExamAccessToken = () => {
  const { exam } = useSelector(state => state.specialExams);
  const dispatch = useDispatch();

  if (!exam) {
    return Promise.resolve();
  }
  return () => dispatch(examRequiresAccessToken());
};
