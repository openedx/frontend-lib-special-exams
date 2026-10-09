import { useContext } from 'react';
import { AppContext } from '@edx/frontend-platform/react';
import PropTypes from 'prop-types';
import Exam from './Exam';
import {
  useActiveAttemptQuery,
  useCheckExamEntry,
  useEndExamWithFailure,
  useExamQuery,
  useReportQueryError,
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

  // An exam sequence fetches its exam (with the course's running attempt); any other sequence fetches
  // only the running attempt, for the timer.
  const examQuery = useExamQuery(courseId, sequence.id, { enabled: !!sequence.isTimeLimited, refetchOnMount: 'always' });
  const attemptQuery = useActiveAttemptQuery(courseId, { enabled: !sequence.isTimeLimited, refetchOnMount: 'always' });
  useReportQueryError(examQuery);
  useReportQueryError(attemptQuery);
  useCheckExamEntry(examQuery, useEndExamWithFailure());

  const isGated = sequence && sequence.gatedContent !== undefined && sequence.gatedContent.gated;

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
