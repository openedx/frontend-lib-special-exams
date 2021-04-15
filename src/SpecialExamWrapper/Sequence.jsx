import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { Provider, connect } from 'react-redux';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { AppContext } from '@edx/frontend-platform/react';
import { getConfig } from '@edx/frontend-platform';
import { Button, Container, Spinner } from '@edx/paragon';
import initializeStore from './data/store'
import { getExamData, getAttemptData, startExam } from './data/thunks'

const ExamSequence = (props) => (
  <div>
    <Container className="border py-5 mb-4">
      <div className="h3">
        Subsection is a Timed Exam ({props.examDuration} minutes)
      </div>
      <p>
        This exam has a time limit associated with it.
        <strong> To pass this exam, you must complete the problems in the time allowed. </strong>
        After you select
        <strong> I am ready to start this timed exam, </strong>
        you will have {props.examDuration} minutes to complete and submit the exam.
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

const _ExamStoreWrapper = ({ children, ...props }) => {
  const { authenticatedUser } = useContext(AppContext);
  const { isLoading, examStarted, examId, examDuration } = props;
  const { sequence, courseId } = props.coursewareCtx;
  const userId = authenticatedUser.userId;

  useEffect(() => {
    props.getExamData(courseId, sequence.id);
    props.getAttemptData(userId, courseId);
  }, []);

  if (isLoading) {
    return <Spinner animation="border" variant="primary" />;
  }

  return sequence.isTimeLimited && !examStarted
    ? <ExamSequence startExam={() => props.startExam(examId)} examDuration={examDuration} />
    : children
};

const mapExamStateToProps = (state) => {
  const {exam} = state;
  console.log('mapExamStateToProps');
  console.log(state);

  return {
    examId: exam.examId,
    isLoading: exam.isLoading,
    examDuration: exam.examDuration,
    attempt: exam.attempt,
    examStarted: exam.examStarted,
  };
};

const ExamStoreWrapper = connect(
  mapExamStateToProps,
  {
    getExamData,
    getAttemptData,
    startExam,
  }
)(_ExamStoreWrapper);


const _SequenceExamWrapper = ({ children, ...props }) => {
  return <Provider store={initializeStore()}>
    <ExamStoreWrapper coursewareCtx={props}>
      {children}
    </ExamStoreWrapper>
  </Provider>
};

const mapCoursewareStateToProps = (state) => {
  const {courseware} = state;

  return {
    courseId: courseware.courseId,
  };
};

const SequenceExamWrapper = connect(
  mapCoursewareStateToProps, {}
)(_SequenceExamWrapper);

export {SequenceExamWrapper};

ExamSequence.propTypes = {
  startExam: PropTypes.func.isRequired,
  examDuration: PropTypes.number,
};

SequenceExamWrapper.propTypes = {
  children: PropTypes.element.isRequired,
  sequence: PropTypes.shape({
    isTimeLimited: PropTypes.bool,
  }).isRequired,
  examDuration: PropTypes.number,
  getExamData: PropTypes.func.isRequired,
  getAttemptData: PropTypes.func.isRequired,
  startExam: PropTypes.func.isRequired,
};
