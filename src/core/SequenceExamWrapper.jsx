import React from 'react';
import ExamWrapper from '../exam/ExamWrapper';
import ExamStateProvider from './ExamStateProvider';

/**
 * SequenceExamWrapper is the component responsible for handling special exams.
 * It takes control over rendering exam instructions unless exam is started only if
 * current sequence item is timed exam. Otherwise, renders any children elements passed.
 * @param children - Current course sequence item content (e.g. unit, navigation buttons etc.)
 * @returns {JSX.Element}
 * @example
 * <SequenceExamWrapper sequence={sequence} courseId={courseId}>
 *   {sequenceContent}
 * </SequenceExamWrapper>
 */
const SequenceExamWrapper = (props) => (
  <ExamStateProvider>
    <ExamWrapper {...props} />
  </ExamStateProvider>
);

export default SequenceExamWrapper;
