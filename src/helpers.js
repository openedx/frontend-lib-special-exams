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

export const generateHumanizedTime = (timeRemainingSeconds) => {
  let hours = 0;
  let minutes = 0;
  let remainingTime = '';

  hours = Math.floor(timeRemainingSeconds / 60 / 60);
  minutes = Math.floor(timeRemainingSeconds / 60) % 60;

  if (hours !== 0) {
    remainingTime += `${hours} hour`;
    if (hours >= 2) {
      remainingTime += 's';
    }
    remainingTime += ' and ';
  }
  remainingTime += `${minutes} minute`;
  if (minutes !== 1) {
    remainingTime += 's';
  }
  return remainingTime;
};

// The only information we get on the remaining time on the active exam attempt
// from the endpoint is the remaining seconds. We need to have a fixed time reference
// on the time limit to be able to calculate the remaining time accurately.
export const appendTimerEnd = (activeAttempt) => {
  if (!activeAttempt?.time_remaining_seconds) {
    return activeAttempt;
  }

  const timerEnds = new Date();
  timerEnds.setSeconds(timerEnds.getSeconds() + activeAttempt.time_remaining_seconds);

  const updatedActiveAttempt = {
    ...activeAttempt,
    timer_ends: timerEnds.toISOString(),
  };

  return updatedActiveAttempt;
};
