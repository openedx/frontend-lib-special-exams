import { examRequiresAccessToken, store } from './data';

export function isExam() {
  const { exam } = store.getState().examState;
  return exam.id !== null;
}

export function getExamAccess() {
  const { examAccessToken } = store.getState().examState;
  return examAccessToken.exam_access_token;
}

export async function fetchExamAccess() {
  const { dispatch } = store;
  return dispatch(examRequiresAccessToken());
}
