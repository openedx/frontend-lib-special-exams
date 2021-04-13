import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { getConfig } from '@edx/frontend-platform';

const ExamSequence = (props) => (
  <div>
    <button type="button" onClick={props.startExam}>Start exam</button>
  </div>
);

const SequenceExamWrapper = ({ children, ...props }) => {
  const [examStarted, setExamStarted] = useState(false);
  const [examId, setExamId] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const { sequence, courseId, loader, userId } = props;

  const getExamData = async () => {
    const examUrl = new URL(
      `${getConfig().LMS_BASE_URL}/api/edx_proctoring/v1/proctored_exam/exam/course_id/${courseId}/content_id/${sequence.id}`
    );
    const { data } = await getAuthenticatedHttpClient().get(examUrl.href);
    setExamId(data.id);
  };

  const getAtemptData = async() => {
    // TODO: find where to get user_id
    const url = new URL(`${getConfig().LMS_BASE_URL}/api/edx_proctoring/v1/proctored_exam/active_exams_for_user?user_id=${userId}&course_id=${encodeURIComponent(courseId)}`);
    const { data } = await getAuthenticatedHttpClient().get(url.href);
    if (Object.keys(data).length > 0) {
      const examData = data[0];
      setExamStarted(examData.attempt.status === 'started');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    getExamData().then(() => getAtemptData());
  }, []);

  const startExam = async () => {
    const url = new URL(`${getConfig().LMS_BASE_URL}/api/edx_proctoring/v1/proctored_exam/attempt`);
    const { data } = await getAuthenticatedHttpClient().post(
      url.href,
      {
        exam_id: examId,
        start_clock: 'true',
      },
    );
    if (data && data.exam_attempt_id) {
      setExamStarted(true);
    }
  };

  if (isLoading) {
    return loader || 'Loading';
  }

  return sequence.isTimeLimited && !examStarted
    ? <ExamSequence startExam={startExam} />
    : children;
};

ExamSequence.propTypes = {
  startExam: PropTypes.func.isRequired,
};

SequenceExamWrapper.propTypes = {
  children: PropTypes.element.isRequired,
  loader: PropTypes.element,
  sequence: PropTypes.shape({
    isTimeLimited: PropTypes.bool,
  }).isRequired,
  userId: PropTypes.number.isRequired,
};

// eslint-disable-next-line import/prefer-default-export
export { SequenceExamWrapper };
