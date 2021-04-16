import React, { useEffect, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { AppContext } from '@edx/frontend-platform/react';
import { Spinner } from '@edx/paragon';
import { ExamInstructions } from '../ExamInstructions';
import {
  getExamData,
  getAttemptData,
  startExam,
  store,
} from './data';

const mapCoursewareStateToProps = (state) => {
  const { courseware } = state;
  return { courseId: courseware.courseId };
};

/**
 * ExamStoreWrapperComp is the component responsible for handling special exams.
 * @param sequence - Current course sequence item
 * @param courseId - Course id string
 * @param children - Current course sequence item content (e.g. unit, navigation buttons etc.)
 * @returns {JSX.Element} - ExamInstructions | children
 * @description As generic approach using nested <Provider store={}> cannot be used with
 * learning app (parent) store provider ATM (https://react-redux.js.org/using-react-redux/accessing-store#multiple-stores)
 * because external Provider component does not have custom context prop specified
 * and uses auto created one, children elements will always be using nested store context
 * (will not be able to access learning app store anymore).
 */
const StoreWrapperComp = ({ sequence, courseId, children }) => {
  const [examState, setExamState] = useState(store.getState());
  const { authenticatedUser } = useContext(AppContext);
  const { isLoading, examStarted, examDuration } = examState.exam;
  const { userId } = authenticatedUser;

  const storeListener = () => {
    setExamState(store.getState());
  };

  const startExamHandler = () => startExam()(store.dispatch, store.getState);

  useEffect(() => {
    store.subscribe(storeListener);
    getExamData(courseId, sequence.id)(store.dispatch);
    getAttemptData(userId, courseId)(store.dispatch);
  }, []);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center flex-column my-5 py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return sequence.isTimeLimited && !examStarted
    ? <ExamInstructions startExam={startExamHandler} examDuration={examDuration} />
    : children;
};
const StoreWrapper = connect(mapCoursewareStateToProps, {})(StoreWrapperComp);

/**
 * SequenceExamWrapper is the component responsible for handling special exams.
 * It takes control over rendering exam instructions unless exam is started only if
 * current sequence item is timed exam. Otherwise, renders any children elements passed.
 * @param children - Current course sequence item content (e.g. unit, navigation buttons etc.)
 * @param props - Current course sequence item
 * @returns {JSX.Element}
 * @example
 * <SequenceExamWrapper sequence={sequence}>
 *   {sequenceContent}
 * </SequenceExamWrapper>
 */
const SequenceExamWrapper = ({ children, ...props }) => (
  <StoreWrapper {...props}>
    {children}
  </StoreWrapper>
);

StoreWrapperComp.propTypes = {
  sequence: PropTypes.shape({
    id: PropTypes.string.isRequired,
    isTimeLimited: PropTypes.bool,
  }).isRequired,
  courseId: PropTypes.string.isRequired,
  children: PropTypes.element.isRequired,
};

SequenceExamWrapper.propTypes = {
  children: PropTypes.element.isRequired,
};

// eslint-disable-next-line import/prefer-default-export
export { SequenceExamWrapper };
