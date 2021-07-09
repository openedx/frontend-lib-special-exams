import React, { useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import ExamStateContext from '../context';
import { ExamTimerBlock } from '../timer';
import ExamAPIError from '../exam/ExamAPIError';
import ExamStateProvider from './ExamStateProvider';

const ExamTimer = ({ courseId }) => {
  const state = useContext(ExamStateContext);
  const {
    activeAttempt, showTimer, stopExam, submitExam,
    expireExam, pollAttempt, apiErrorMsg, pingAttempt,
    getExamAttemptsData,
  } = state;

  useEffect(() => {
    getExamAttemptsData(courseId);
  }, [courseId]);

  return (
    <div className="d-flex flex-column justify-content-center">
      {showTimer && (
        <ExamTimerBlock
          attempt={activeAttempt}
          stopExamAttempt={stopExam}
          submitExam={submitExam}
          expireExamAttempt={expireExam}
          pollExamAttempt={pollAttempt}
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
