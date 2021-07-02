import React, { useContext, useEffect } from 'react';
import { AppContext } from '@edx/frontend-platform/react';
import PropTypes from 'prop-types';
import Exam from './Exam';
import ExamStateContext from '../context';

/**
 * Exam wrapper is responsible for triggering initial exam data fetching and rendering Exam.
 */
const ExamWrapper = ({ children, ...props }) => {
  const state = useContext(ExamStateContext);
  const { authenticatedUser } = useContext(AppContext);
  const { sequence, courseId } = props;
  const { getExamAttemptsData, getAllowProctoringOptOut } = state;
  const loadInitialData = async () => {
    await getExamAttemptsData(courseId, sequence.id);
    await getAllowProctoringOptOut(sequence.allowProctoringOptOut);
  };

// if the user is browsing public content (not logged in) they cannot be in an exam
// any requests for exam state will 403 so just short circuit this component here
  if (!authenticatedUser) {
    return children;
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  return (
    <Exam isTimeLimited={sequence.isTimeLimited}>
      {children}
    </Exam>
  );
};

ExamWrapper.propTypes = {
  sequence: PropTypes.shape({
    id: PropTypes.string.isRequired,
    isTimeLimited: PropTypes.bool,
    allowProctoringOptOut: PropTypes.bool,
  }).isRequired,
  courseId: PropTypes.string.isRequired,
  children: PropTypes.element.isRequired,
};

export default ExamWrapper;
