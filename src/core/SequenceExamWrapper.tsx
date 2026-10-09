import React, { useMemo } from 'react';
import ExamWrapper from '../exam/ExamWrapper';
import SequenceExamContext from './SequenceExamContext';

export interface SequenceExamWrapperProps {
  courseId: string;
  sequence: {
    id: string;
    isTimeLimited?: boolean;
    allowProctoringOptOut?: boolean;
    gatedContent?: { gated?: boolean };
  };
  isStaff?: boolean;
  originalUserIsStaff?: boolean;
  canAccessProctoredExams?: boolean;
  /**
   * Rendered in place of the default "You have submitted your timed exam." heading once a timed exam
   * is submitted. It receives `timeIsOver`, true when the submission was forced by the time limit.
   */
  submittedTimedExamInstructions?: React.ElementType;
  /** Current course sequence item content (e.g. unit, navigation buttons etc.) */
  children: React.ReactElement;
}

/**
 * SequenceExamWrapper is the component responsible for handling special exams.
 * It takes control over rendering exam instructions unless exam is started only if
 * current sequence item is timed exam. Otherwise, renders any children elements passed.
 * @example
 * <SequenceExamWrapper sequence={sequence} courseId={courseId}>
 *   {sequenceContent}
 * </SequenceExamWrapper>
 */
const SequenceExamWrapper = ({ submittedTimedExamInstructions, ...props }: SequenceExamWrapperProps) => {
  const { courseId, sequence } = props;
  const sequenceExam = useMemo(() => ({
    courseId,
    sequenceId: sequence.id,
    isTimeLimited: sequence.isTimeLimited,
    allowProctoringOptOut: sequence.allowProctoringOptOut,
    submittedTimedExamInstructions,
  }), [courseId, sequence.id, sequence.isTimeLimited, sequence.allowProctoringOptOut, submittedTimedExamInstructions]);
  return (
    <SequenceExamContext.Provider value={sequenceExam}>
      <ExamWrapper {...props} />
    </SequenceExamContext.Provider>
  );
};

export default SequenceExamWrapper;
