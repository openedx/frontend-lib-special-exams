import { examRequiresAccessToken, store } from './data';

export function isExam() {
  const { exam } = store.getState().specialExams;
  return !!exam?.id;
}

export function getExamAccess() {
  const { exam, examAccessToken } = store.getState().specialExams;
  if (!exam) {
    return '';
  }
  return examAccessToken.exam_access_token;
}

export async function fetchExamAccess() {
  const { exam } = store.getState().specialExams;
  const { dispatch } = store;
  if (!exam) {
    return Promise.resolve();
  }
  return dispatch(examRequiresAccessToken());
}
