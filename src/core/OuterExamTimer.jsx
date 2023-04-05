import React, { useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { AppContext } from '@edx/frontend-platform/react';
import ExamStateContext from '../context';
import { ExamTimerBlock } from '../timer';
import ExamAPIError from '../exam/ExamAPIError';
import ExamStateProvider from './ExamStateProvider';

const ExamTimer = ({ courseId }) => {
  const state = useContext(ExamStateContext);
  const { authenticatedUser } = useContext(AppContext);
  const {
    activeAttempt, showTimer, stopExam, submitExam,
    expireExam, apiErrorMsg, pingAttempt,
    getLatestAttemptData,
  } = state;

  // if user is not authenticated they cannot have active exam, so no need for timer
  // (also exam API would return 403 error)
  if (!authenticatedUser) {
    return null;
  }

  useEffect(() => {
    getLatestAttemptData(courseId);
  }, [courseId]);

  return (
    <div className="d-flex flex-column justify-content-center">
      {showTimer && (
        <ExamTimerBlock
          attempt={activeAttempt}
          stopExamAttempt={stopExam}
          submitExam={submitExam}
          expireExamAttempt={expireExam}
          pingAttempt={pingAttempt}
        />
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
const OuterExamTimer = ({ courseId }) => (
  <ExamStateProvider>
    <ExamTimer courseId={courseId} />
  </ExamStateProvider>
);

OuterExamTimer.propTypes = {
  courseId: PropTypes.string.isRequired,
};

export default OuterExamTimer;
