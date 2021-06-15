import React, { useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import Exam from './Exam';
import ExamStateContext from '../context';

/**
 * Exam wrapper is responsible for triggering initial exam data fetching and rendering Exam.
 */
const ExamWrapper = ({ children, ...props }) => {
  const state = useContext(ExamStateContext);
  const { sequence, courseId } = props;
  const { getExamAttemptsData, getAllowProctoringOptOut } = state;
  const loadInitialData = async () => {
    await getExamAttemptsData(courseId, sequence.id);
    await getAllowProctoringOptOut(sequence.allowProctoringOptOut);
  };

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
