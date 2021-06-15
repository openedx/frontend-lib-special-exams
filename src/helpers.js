import { ExamType, IS_INCOMPLETE_STATUS } from './constants';

export const isEmpty = (obj) => {
  if (!obj) { return true; }
  return Object.keys(obj).length === 0;
};

export const getDisplayName = (WrappedComponent) => WrappedComponent.displayName || WrappedComponent.name || 'Component';

export const shouldRenderExpiredPage = (exam) => {
  const { type: examType, passed_due_date: passedDueDate, attempt } = exam;
  if (!passedDueDate || examType === ExamType.PRACTICE) {
    return false;
  }
  return (isEmpty(attempt) || !attempt.attempt_id || IS_INCOMPLETE_STATUS(attempt.attempt_status));
};
