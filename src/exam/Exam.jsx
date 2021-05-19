import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Spinner } from '@edx/paragon';
import { ExamTimerBlock } from '../timer';
import Instructions from '../instructions';
import ExamStateContext from '../context';
import ExamAPIError from './ExamAPIError';

/**
 * Exam component is intended to render exam instructions before and after exam.
 * It is also responsible for rendering exam timer block/component during the exam.
 * If children do not relate to exam sequence, render them directly.
 * @param isTimeLimited - boolean used to identify if we need to process sequence as an exam
 * @param children - sequence content
 * @returns {JSX.Element}
 * @constructor
 */
const Exam = ({ isTimeLimited, children }) => {
  const state = useContext(ExamStateContext);
  const {
    isLoading, activeAttempt, showTimer,
    stopExam, expireExam, pollAttempt, apiErrorMsg,
  } = state;

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center flex-column my-5 py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  const sequenceContent = <>{children}</>;

  return (
    <div className="d-flex flex-column justify-content-center">
      {showTimer && (
        <ExamTimerBlock
          attempt={activeAttempt}
          stopExamAttempt={stopExam}
          expireExamAttempt={expireExam}
          pollExamAttempt={pollAttempt}
        />
      )}
      {apiErrorMsg && <ExamAPIError details={apiErrorMsg} />}
      {isTimeLimited
        ? <Instructions>{sequenceContent}</Instructions>
        : sequenceContent}
    </div>
  );
};

Exam.propTypes = {
  isTimeLimited: PropTypes.bool.isRequired,
  children: PropTypes.element.isRequired,
};

export default Exam;
