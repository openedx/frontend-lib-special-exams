import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { Provider, connect } from 'react-redux';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { AppContext } from '@edx/frontend-platform/react';
import { getConfig } from '@edx/frontend-platform';
import { Button, Container, Spinner } from '@edx/paragon';
// import { getExamData, getUserAtemptsData } from './data/api'
import store from './data/store'
import getExamData from './data/thunks'

const ExamSequence = (props) => (
  <div>
    <Container className="border py-5 mb-4">
      <div className="h3">
        Subsection is a Timed Exam (30 minutes)
      </div>
      <p>
        This exam has a time limit associated with it.
        <strong> To pass this exam, you must complete the problems in the time allowed. </strong>
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

    <div className="footer-sequence">
      <div className="h4">Can I request additional time to complete my exam? </div>
      <p>
        If you have disabilities,
        you might be eligible for an additional time allowance on timed exams.
        Ask your course team for information about additional time allowances.
      </p>
    </div>
  </div>
);

const _SequenceExamWrapper = ({ children, ...props }) => {
  const [examStarted, setExamStarted] = useState(false);
  const [examId, setExamId] = useState();
  // const [isLoading, setIsLoading] = useState(true);
  const { authenticatedUser } = useContext(AppContext);
  const { sequence, courseId, isLoading } = props;

  // const getExam = async () => {
  //   const data = await getExamData(courseId, sequence.id);
  //   setExamId(data.id);
  // };

  // const getUserAtempt = async() => {
  //   const userId = authenticatedUser.userId;
  //   const data = await getUserAtemptsData(userId, courseId);
  //   if (Object.keys(data).length > 0) {
  //     const examData = data[0];
  //     setExamStarted(examData.attempt.status === 'started');
  //   }
  //   setIsLoading(false);
  // };

  useEffect(() => {
    // props.getExamData();
    // getExam().then(() => getUserAtempt());
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
    return <Spinner animation="border" variant="primary" />;
  }

  return sequence.isTimeLimited && !examStarted
    ? 
    <Provider store={store}>
      <ExamSequence startExam={startExam} />
    </Provider>
    : children;
};

ExamSequence.propTypes = {
  startExam: PropTypes.func.isRequired,
};


const mapStateToProps = (state) => {
  const {courseware} = state;
  console.log(state);

  return {
    courseId: courseware.courseId,
  };
};

export const SequenceExamWrapper = connect(mapStateToProps, {
  getExamData,
})(_SequenceExamWrapper);

SequenceExamWrapper.propTypes = {
  children: PropTypes.element.isRequired,
  sequence: PropTypes.shape({
    isTimeLimited: PropTypes.bool,
  }).isRequired,
};
