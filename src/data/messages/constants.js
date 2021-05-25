const SUBMIT_MAP = Object.freeze({
  promptEventName: 'endExamAttempt',
  successEventName: 'examAttemptEnded',
  failureEventName: 'examAttemptEndFailed',
});

const START_MAP = Object.freeze({
  promptEventName: 'startExamAttempt',
  successEventName: 'examAttemptStarted',
  failureEventName: 'examAttemptStartFailed',
});

const PING_MAP = Object.freeze({
  promptEventName: 'ping',
  successEventName: 'echo',
  failureEventName: 'pingFailed',
});

const actionToMessageTypesMap = Object.freeze({
  submit: SUBMIT_MAP,
  start: START_MAP,
  ping: PING_MAP,
});

export default actionToMessageTypesMap;
