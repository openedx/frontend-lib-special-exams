import { useDispatch, useSelector } from 'react-redux';
import React, { useContext, useEffect } from 'react';
import { AppContext } from '@edx/frontend-platform/react';
import PropTypes from 'prop-types';
import Exam from './Exam';
import {
  getExamAttemptsData,
  getAllowProctoringOptOut,
  checkExamEntry,
} from '../data';

/**
 * Exam wrapper is responsible for triggering initial exam data fetching and rendering Exam.
 */
const ExamWrapper = ({ children, ...props }) => {
  const { authenticatedUser } = useContext(AppContext);
  const {
    sequence,
    courseId,
    isStaff,
    originalUserIsStaff,
    canAccessProctoredExams,
  } = props;

  const { isLoading } = useSelector(state => state.specialExams);

  const dispatch = useDispatch();

  const loadInitialData = async () => {
    await dispatch(getExamAttemptsData(courseId, sequence.id));
    await dispatch(getAllowProctoringOptOut(sequence.allowProctoringOptOut));
    await dispatch(checkExamEntry());
  };

  const isGated = sequence && sequence.gatedContent !== undefined && sequence.gatedContent.gated;

  useEffect(() => {
    // fetch exam data on exam sequences or if no exam data has been fetched yet
    if (sequence.isTimeLimited || isLoading) {
      loadInitialData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // if the user is browsing public content (not logged in) they cannot be in an exam
  // if the user is staff they may view exam content without an exam attempt
  // any requests for exam state will 403 so just short circuit this component here
  if (!authenticatedUser || isStaff) {
    return children;
  }

  return (
    <Exam
      isGated={isGated}
      isTimeLimited={sequence.isTimeLimited}
      originalUserIsStaff={originalUserIsStaff}
      canAccessProctoredExams={canAccessProctoredExams}
    >
      {children}
    </Exam>
  );
};

ExamWrapper.propTypes = {
  sequence: PropTypes.shape({
    id: PropTypes.string.isRequired,
    isTimeLimited: PropTypes.bool,
    allowProctoringOptOut: PropTypes.bool,
    gatedContent: PropTypes.shape({
      gated: PropTypes.bool,
    }),
  }).isRequired,
  courseId: PropTypes.string.isRequired,
  children: PropTypes.element.isRequired,
  isStaff: PropTypes.bool,
  originalUserIsStaff: PropTypes.bool,
  canAccessProctoredExams: PropTypes.bool,
};

ExamWrapper.defaultProps = {
  isStaff: false,
  originalUserIsStaff: false,
  canAccessProctoredExams: true,
};

export default ExamWrapper;
