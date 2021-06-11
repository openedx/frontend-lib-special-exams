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

const Instructions = ({ children }) => {
  const state = useContext(ExamStateContext);
  const { exam, verification } = state;
  const { attempt, type: examType, prerequisite_status: prerequisitesData } = exam || {};
  const prerequisitesPassed = prerequisitesData ? prerequisitesData.are_prerequisites_satisifed : true;
  let verificationStatus = verification.status || '';
  const { verification_url: verificationUrl } = attempt || {};
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
    case attempt.attempt_status === ExamStatus.CREATED:
      return examType === ExamType.PROCTORED && verificationStatus !== VerificationStatus.APPROVED
        ? <VerificationProctoredExamInstructions status={verificationStatus} verificationUrl={verificationUrl} />
        : <DownloadSoftwareProctoredExamInstructions skipProctoredExam={toggleSkipProctoredExam} />;
    case attempt.attempt_status === ExamStatus.DOWNLOAD_SOFTWARE_CLICKED:
      return <DownloadSoftwareProctoredExamInstructions />;
    case attempt.attempt_status === ExamStatus.READY_TO_START:
      return <ReadyToStartProctoredExamInstructions />;
    case attempt.attempt_status === ExamStatus.READY_TO_SUBMIT:
      return <SubmitExamInstructions />;
    case attempt.attempt_status === ExamStatus.SUBMITTED:
      return <SubmittedExamInstructions examType={examType} />;
    case attempt.attempt_status === ExamStatus.VERIFIED:
      return <VerifiedExamInstructions examType={examType} />;
    case attempt.attempt_status === ExamStatus.REJECTED:
      return <RejectedInstructions examType={examType} />;
    case attempt.attempt_status === ExamStatus.ERROR:
      return <ErrorExamInstructions examType={examType} />;
    case attempt.attempt_status === ExamStatus.READY_TO_RESUME:
      return <EntranceExamInstructions examType={examType} skipProctoredExam={toggleSkipProctoredExam} />;
    case examType === ExamType.PROCTORED && IS_ONBOARDING_ERROR(attempt.attempt_status):
      return <OnboardingErrorProctoredExamInstructions />;
    default:
      return children;
  }
};

Instructions.propTypes = {
  children: PropTypes.element.isRequired,
};

export default Instructions;
