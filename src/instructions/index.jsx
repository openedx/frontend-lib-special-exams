import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import {
  VerificationProctoredExamInstructions,
  DownloadSoftwareProctoredExamInstructions,
  ReadyToStartProctoredExamInstructions,
  PrerequisitesProctoredExamInstructions,
  SkipProctoredExamInstruction,
  OnboardingErrorProctoredExamInstructions,
} from './proctored_exam';
import { isEmpty, shouldRenderExpiredPage } from '../helpers';
import {
  ExamStatus,
  VerificationStatus,
  ExamType,
  IS_ONBOARDING_ERROR,
} from '../constants';
import ExamStateContext from '../context';
import EntranceExamInstructions from './EntranceInstructions';
import SubmitExamInstructions from './SubmitInstructions';
import RejectedInstructions from './RejectedInstructions';
import ErrorExamInstructions from './ErrorInstructions';
import SubmittedExamInstructions from './SubmittedInstructions';
import VerifiedExamInstructions from './VerifiedInstructions';
import ExpiredInstructions from './ExpiredInstructions';
import UnknownAttemptStatusError from './UnknownAttemptStatusError';

const Instructions = ({ children }) => {
  const state = useContext(ExamStateContext);
  const { exam, verification } = state;
  const {
    attempt,
    type: examType,
    prerequisite_status: prerequisitesData,
    passed_due_date: passedDueDate,
    hide_after_due: hideAfterDue,
  } = exam || {};
  const prerequisitesPassed = prerequisitesData ? prerequisitesData.are_prerequisites_satisifed : true;
  let verificationStatus = verification.status || '';
  const { verification_url: verificationUrl, attempt_status: attemptStatus } = attempt || {};
  const [skipProctoring, toggleSkipProctoring] = useState(false);
  const toggleSkipProctoredExam = () => toggleSkipProctoring(!skipProctoring);
  const expired = shouldRenderExpiredPage(exam);

  if (expired) {
    return <ExpiredInstructions />;
  }

  const renderEmptyAttemptInstructions = () => {
    let component = <EntranceExamInstructions examType={examType} skipProctoredExam={toggleSkipProctoredExam} />;
    if (examType === ExamType.PROCTORED && !prerequisitesPassed) {
      component = <PrerequisitesProctoredExamInstructions skipProctoredExam={toggleSkipProctoredExam} />;
    }
    return component;
  };

  // The API does not explicitly return 'expired' status, so we have to check manually.
  // expires attribute is returned only for approved status, so it is safe to do this
  // (meaning we won't override 'must_reverify' status for example)
  if (verification.expires && new Date() > new Date(verification.expires)) {
    verificationStatus = VerificationStatus.EXPIRED;
  }

  switch (true) {
    case examType === ExamType.PROCTORED && skipProctoring:
      return <SkipProctoredExamInstruction cancelSkipProctoredExam={toggleSkipProctoredExam} />;
    case isEmpty(attempt) || !attempt.attempt_id:
      return renderEmptyAttemptInstructions();
    case attemptStatus === ExamStatus.CREATED:
      return examType === ExamType.PROCTORED && verificationStatus !== VerificationStatus.APPROVED
        ? <VerificationProctoredExamInstructions status={verificationStatus} verificationUrl={verificationUrl} />
        : <DownloadSoftwareProctoredExamInstructions skipProctoredExam={toggleSkipProctoredExam} />;
    case attemptStatus === ExamStatus.DOWNLOAD_SOFTWARE_CLICKED:
      return <DownloadSoftwareProctoredExamInstructions />;
    case attemptStatus === ExamStatus.READY_TO_START:
      return <ReadyToStartProctoredExamInstructions />;
    case attemptStatus === ExamStatus.READY_TO_SUBMIT:
      return <SubmitExamInstructions />;
    case attemptStatus === ExamStatus.SUBMITTED:
      // don't show submitted page for timed exam if exam has passed due date
      // and in studio visibility option is set to 'show entire section'
      // instead show exam content
      if (examType === ExamType.TIMED && passedDueDate && !hideAfterDue) {
        return children;
      }
      return <SubmittedExamInstructions examType={examType} />;
    case attemptStatus === ExamStatus.SECOND_REVIEW_REQUIRED:
      return <SubmittedExamInstructions examType={examType} />;
    case attemptStatus === ExamStatus.VERIFIED:
      return <VerifiedExamInstructions examType={examType} />;
    case attemptStatus === ExamStatus.REJECTED:
      return <RejectedInstructions examType={examType} />;
    case attemptStatus === ExamStatus.ERROR:
      return <ErrorExamInstructions examType={examType} />;
    case attemptStatus === ExamStatus.READY_TO_RESUME:
      return <EntranceExamInstructions examType={examType} skipProctoredExam={toggleSkipProctoredExam} />;
    case examType === ExamType.PROCTORED && IS_ONBOARDING_ERROR(attemptStatus):
      return <OnboardingErrorProctoredExamInstructions />;
    case attemptStatus === ExamStatus.STARTED:
      return children;
    default:
      return <UnknownAttemptStatusError />;
  }
};

Instructions.propTypes = {
  children: PropTypes.element.isRequired,
};

export default Instructions;
