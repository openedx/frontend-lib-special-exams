import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { ExamTimerBlock } from '../timer';
import ExamAPIError from '../exam/ExamAPIError';
import { useActiveAttempt, useActiveAttemptQuery, useReportQueryError } from '../data';
import { IS_STARTED_STATUS } from '../constants';
import SequenceExamContext, { useExamClientState, useSequenceExam } from './SequenceExamContext';
import { useSpecialExams } from './SpecialExamsProvider';

const ExamTimer = ({ courseId }) => {
  const { apiErrorMsg } = useSequenceExam();
  const { isAuthenticated } = useSpecialExams();
  useReportQueryError(useActiveAttemptQuery(courseId, { enabled: isAuthenticated, refetchOnMount: 'always' }));
  const activeAttempt = useActiveAttempt();
  const showTimer = !!(activeAttempt && IS_STARTED_STATUS(activeAttempt.attempt_status));

  // if user is not authenticated they cannot have active exam, so no need for timer
  // (also exam API would return 403 error)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="d-flex flex-column justify-content-center">
      {showTimer && (
        <ExamTimerBlock />
      )}
      {apiErrorMsg && <ExamAPIError />}
    </div>
  );
};

ExamTimer.propTypes = {
  courseId: PropTypes.string.isRequired,
};

/**
 * OuterExamTimer is the component responsible for showing exam timer on non-sequence pages.
 * @param courseId - Id of a course that is checked for active exams, if there is one the timer
 * will be shown.
 */
const OuterExamTimer = ({ courseId }) => {
  const clientState = useExamClientState();
  const sequenceExam = useMemo(() => ({ courseId, ...clientState }), [courseId, clientState]);
  return (
    <SequenceExamContext.Provider value={sequenceExam}>
      <ExamTimer courseId={courseId} />
    </SequenceExamContext.Provider>
  );
};

OuterExamTimer.propTypes = {
  courseId: PropTypes.string.isRequired,
};

export default OuterExamTimer;
