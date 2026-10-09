import React, { useContext, useMemo, useState } from 'react';

export interface SequenceExamIdentity {
  courseId?: string;
  sequenceId?: string;
  isTimeLimited?: boolean;
  allowProctoringOptOut?: boolean;
  submittedTimedExamInstructions?: React.ElementType;
}

export interface ExamClientState {
  timeIsOver: boolean;
  apiErrorMsg: string;
  setTimeIsOver: (timeIsOver: boolean) => void;
  setApiError: (message: string) => void;
}

export interface SequenceExam extends SequenceExamIdentity, ExamClientState {}

const noop = () => {};
export const defaultExamClientState: ExamClientState = {
  timeIsOver: false, apiErrorMsg: '', setTimeIsOver: noop, setApiError: noop,
};

const SequenceExamContext = React.createContext<SequenceExam>(defaultExamClientState);

export const useSequenceExam = () => useContext(SequenceExamContext);

export const useExamClientState = (): ExamClientState => {
  const [timeIsOver, setTimeIsOver] = useState(false);
  const [apiErrorMsg, setApiError] = useState('');
  return useMemo(() => ({
    timeIsOver, apiErrorMsg, setTimeIsOver, setApiError,
  }), [timeIsOver, apiErrorMsg]);
};

export default SequenceExamContext;
