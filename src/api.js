import { examRequiresAccessToken, store } from './data';

export function isExam() {
  const { exam } = store.getState().examState;
  return !!exam?.id;
}

export function getExamAccess() {
  const { exam, examAccessToken } = store.getState().examState;
  if (!exam) {
    return '';
  }
  return examAccessToken.exam_access_token;
}

export async function fetchExamAccess() {
  const { exam } = store.getState().examState;
  const { dispatch } = store;
  if (!exam) {
    return Promise.resolve();
  }
  return dispatch(examRequiresAccessToken());
}
