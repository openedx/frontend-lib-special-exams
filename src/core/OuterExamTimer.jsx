import React, { useEffect, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { AppContext } from '@edx/frontend-platform/react';
import { ExamTimerBlock } from '../timer';
import ExamAPIError from '../exam/ExamAPIError';
import { getLatestAttemptData } from '../data';
import { IS_STARTED_STATUS } from '../constants';

const ExamTimer = ({ courseId }) => {
  const { activeAttempt, apiErrorMsg } = useSelector(state => state.specialExams);
  const { authenticatedUser } = useContext(AppContext);
  const showTimer = !!(activeAttempt && IS_STARTED_STATUS(activeAttempt.attempt_status));
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getLatestAttemptData(courseId));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  // if user is not authenticated they cannot have active exam, so no need for timer
  // (also exam API would return 403 error)
  if (!authenticatedUser) {
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
const OuterExamTimer = ({ courseId }) => (
  <ExamTimer courseId={courseId} />
);

OuterExamTimer.propTypes = {
  courseId: PropTypes.string.isRequired,
};

export default OuterExamTimer;
