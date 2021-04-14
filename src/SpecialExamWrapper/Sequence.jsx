import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { getConfig } from '@edx/frontend-platform';
import { Button, Container, Spinner } from '@edx/paragon';
import { getExamData, getUserAtemptsData } from './data/api'

const ExamSequence = (props) => (
  <div>
    <Container className="border py-5 mb-4">
      <div className="h3">
        Subsection is a Timed Exam (30 minutes)
      </div>
      <p>
        This exam has a time limit associated with it.
        <strong> To pass this exam, you must complete the problems in the time allowed.</strong>
        After you select
        <strong> I am ready to start this timed exam, </strong>
        you will have 30 minutes to complete and submit the exam.
      </p>
      <Button
        variant="outline-primary"
        onClick={props.startExam}
      >
        I am ready to start this timed exam.
      </Button>
    </Container>

    <div class="footer-sequence">
      <div className="h4">Can I request additional time to complete my exam? </div>
      <p>
        If you have disabilities,
        you might be eligible for an additional time allowance on timed exams.
        Ask your course team for information about additional time allowances.
      </p>
    </div>
  </div>
);

const SequenceExamWrapper = ({ children, ...props }) => {
  const [examStarted, setExamStarted] = useState(false);
  const [examId, setExamId] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const { sequence, courseId, loader, userId } = props;

  const getExam = async () => {
    const data = await getExamData(courseId, sequence.id);
    setExamId(data.id);
  };

  const getUserAtempt = async() => {
    const data = await getUserAtemptsData(userId, courseId);
    if (Object.keys(data).length > 0) {
      const examData = data[0];
      setExamStarted(examData.attempt.status === 'started');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    getExam().then(() => getUserAtempt());
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
    return loader || <Spinner animation="border" variant="primary" />;
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
