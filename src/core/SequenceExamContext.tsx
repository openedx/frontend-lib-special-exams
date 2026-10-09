import React, { useContext } from 'react';

export interface SequenceExam {
  courseId?: string;
  /** Absent outside a sequence (the outer timer). */
  sequenceId?: string;
  isTimeLimited?: boolean;
  allowProctoringOptOut?: boolean;
  submittedTimedExamInstructions?: React.ElementType;
}

const SequenceExamContext = React.createContext<SequenceExam>({});

export const useSequenceExam = () => useContext(SequenceExamContext);

export default SequenceExamContext;
