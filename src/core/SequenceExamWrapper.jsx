import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import ExamWrapper from '../exam/ExamWrapper';
import SequenceExamContext from './SequenceExamContext';

/**
 * SequenceExamWrapper is the component responsible for handling special exams.
 * It takes control over rendering exam instructions unless exam is started only if
 * current sequence item is timed exam. Otherwise, renders any children elements passed.
 * @param children - Current course sequence item content (e.g. unit, navigation buttons etc.)
 * @param submittedTimedExamInstructions - Optional component rendered in place of the default
 * "You have submitted your timed exam." heading once a timed exam is submitted. It receives
 * `timeIsOver`, true when the submission was forced by the time limit.
 * @returns {JSX.Element}
 * @example
 * <SequenceExamWrapper sequence={sequence} courseId={courseId}>
 *   {sequenceContent}
 * </SequenceExamWrapper>
 */
const SequenceExamWrapper = ({ submittedTimedExamInstructions, ...props }) => {
  const sequenceExam = useMemo(() => ({ submittedTimedExamInstructions }), [submittedTimedExamInstructions]);
  return (
    <SequenceExamContext.Provider value={sequenceExam}>
      <ExamWrapper {...props} />
    </SequenceExamContext.Provider>
  );
};

SequenceExamWrapper.propTypes = {
  submittedTimedExamInstructions: PropTypes.elementType,
};

SequenceExamWrapper.defaultProps = {
  submittedTimedExamInstructions: undefined,
};

export default SequenceExamWrapper;
