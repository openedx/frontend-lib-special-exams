import React, { useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { Alert, Spinner } from '@edx/paragon';
import { Info } from '@edx/paragon/icons';
import { ExamTimerBlock } from '../timer';
import Instructions from '../instructions';
import ExamStateContext from '../context';
import ExamAPIError from './ExamAPIError';
import { ExamStatus, ExamType } from '../constants';

/**
 * Exam component is intended to render exam instructions before and after exam.
 * It is also responsible for rendering exam timer block/component during the exam.
 * If children do not relate to exam sequence, render them directly.
 * @param isTimeLimited - boolean used to identify if we need to process sequence as an exam
 * @param children - sequence content
 * @returns {JSX.Element}
 * @constructor
 */
const Exam = ({ isTimeLimited, originalUserIsStaff, children }) => {
  const state = useContext(ExamStateContext);
  const {
    isLoading, activeAttempt, showTimer, stopExam, exam,
    expireExam, pollAttempt, apiErrorMsg, pingAttempt,
    getVerificationData, getProctoringSettings, submitExam,
  } = state;

  const {
    attempt,
    type: examType,
    id: examId,
    passed_due_date: passedDueDate,
    hide_after_due: hideAfterDue,
  } = exam || {};
  const { attempt_status: attemptStatus } = attempt || {};

  const shouldShowMasqueradeAlert = () => {
    // if course staff is masquerading as a specific learner, they should be able
    // to view the exam content regardless of the learner's current state
    if (originalUserIsStaff && isTimeLimited) {
      if (examType === ExamType.TIMED && passedDueDate && !hideAfterDue) {
        // if the learner is able to view exam content after the due date is passed,
        // don't show this alert
        return false;
      }
      return attemptStatus !== ExamStatus.STARTED;
    }
    return false;
  };

  useEffect(() => {
    if (examId) {
      getProctoringSettings();
    }
    if (examType === ExamType.PROCTORED) {
      getVerificationData();
    }

    // this makes sure useEffect gets called only one time after the exam has been fetched
    // we can't leave this empty since initially exam is just an empty object, so
    // API calls above would not get triggered
  }, [examId]);

  if (isLoading) {
    return (
      <div data-testid="spinner" className="d-flex justify-content-center align-items-center flex-column my-5 py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  const sequenceContent = <>{children}</>;

  return (
    <div className="d-flex flex-column justify-content-center">
      {shouldShowMasqueradeAlert() && (
        <Alert variant="info" icon={Info} data-testid="masquerade-alert">
          <FormattedMessage
            id="exam.hiddenContent"
            defaultMessage="This exam is hidden from the learner."
          />
        </Alert>
      )}
      {showTimer && (
        <ExamTimerBlock
          attempt={activeAttempt}
          stopExamAttempt={stopExam}
          submitExam={submitExam}
          expireExamAttempt={expireExam}
          pollExamAttempt={pollAttempt}
          pingAttempt={pingAttempt}
        />
      )}
      {apiErrorMsg && <ExamAPIError />}
      {isTimeLimited && !originalUserIsStaff
        ? <Instructions>{sequenceContent}</Instructions>
        : sequenceContent}
    </div>
  );
};

Exam.propTypes = {
  isTimeLimited: PropTypes.bool.isRequired,
  originalUserIsStaff: PropTypes.bool.isRequired,
  children: PropTypes.element.isRequired,
};

export default Exam;
