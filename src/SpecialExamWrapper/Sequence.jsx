import React, { useState } from 'react';
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
  const { sequence } = props;

  const startExam = async () => {
    const url = new URL(`${getConfig().LMS_BASE_URL}/api/edx_proctoring/v1/proctored_exam/attempt`);
    const { data } = await getAuthenticatedHttpClient().post(
      url.href,
      {
        exam_id: 1,
        start_clock: 'true',
      },
    );
    if (data && data.exam_attempt_id) {
      setExamStarted(true);
    }
  };

  return sequence.isTimeLimited && !examStarted
    ? <ExamSequence startExam={startExam} />
    : children;
};

ExamSequence.propTypes = {
  startExam: PropTypes.func.isRequired,
};

SequenceExamWrapper.propTypes = {
  children: PropTypes.element.isRequired,
  sequence: PropTypes.shape({
    isTimeLimited: PropTypes.bool,
  }).isRequired,
};

// eslint-disable-next-line import/prefer-default-export
export { SequenceExamWrapper };
