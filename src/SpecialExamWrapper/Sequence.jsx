import React, { useEffect, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { AppContext } from '@edx/frontend-platform/react';
import { Spinner } from '@edx/paragon';
import { ExamSequence } from '../ExamSequence';
import {
  getExamData,
  getAttemptData,
  startExam,
  store,
} from './data';


const _ExamStoreWrapper = ({ children, ...props }) => {
  const { authenticatedUser } = useContext(AppContext);
  const { isLoading, examStarted, examId, examDuration } = props.exam;
  const { sequence, courseId } = props;
  const { userId } = authenticatedUser;

  useEffect(() => {
    getExamData(courseId, sequence.id)(store.dispatch);
    getAttemptData(userId, courseId)(store.dispatch);
  }, []);

  if (isLoading) {
    return <Spinner animation="border" variant="primary" />;
  }

  return sequence.isTimeLimited && !examStarted
    ? <ExamSequence startExam={() => startExam()(store.dispatch, store.getState)} examDuration={examDuration} />
    : children;
};

const mapCoursewareStateToProps = (state) => {
  const { courseware } = state;

  return {
    courseId: courseware.courseId,
  };
};

const ExamStoreWrapper = connect(
  mapCoursewareStateToProps, {},
)(_ExamStoreWrapper);


const SequenceExamWrapper = ({ children, ...props }) => {
  const [examState, setExamState] = useState(store.getState());
  const storeListener = () => {
    setExamState(store.getState());
  };
  useEffect(() => {
    store.subscribe(storeListener);
  }, []);
  return (
    <ExamStoreWrapper {...props} {...examState}>
      {children}
    </ExamStoreWrapper>
  );
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

// eslint-disable-next-line import/prefer-default-export
export { SequenceExamWrapper };
