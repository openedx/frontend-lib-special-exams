import React, { useState } from 'react';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';

const ExamSequence = (props) => (
  <div>
    <button onClick={props.startExam}>Start exam</button>
  </div>
);

const SequenceExamWrapper = ({children, ...props}) => {
  const [examStarted, setExamStarted] = useState(false);
  const { sequence } = props;

  const startExam = async () => {
    const { data } = await getAuthenticatedHttpClient().post(
      'http://localhost:18000/api/edx_proctoring/v1/proctored_exam/attempt',
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

export { SequenceExamWrapper, ExamSequence };
