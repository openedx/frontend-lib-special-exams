import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import StartExamInstructions from './StartExamInstructions';
import SubmitExamInstructions from './SubmitExamInstructions';
import SubmittedExamInstructions from './SubmittedExamInstructions';
import {
  EntranceProctoredExamInstructions,
  VerificationProctoredExamInstructions,
  SubmitProctoredExamInstructions,
  SubmittedProctoredExamInstructions,
  VerifiedProctoredExamInstructions,
  RejectedProctoredExamInstructions,
  DownloadSoftwareProctoredExamInstructions,
  ReadyToStartProctoredExamInstructions,
} from './proctored_exam';
import { isEmpty } from '../helpers';
import { ExamStatus, VerificationStatus } from '../constants';
import ExamStateContext from '../context';

const Instructions = ({ children }) => {
  const state = useContext(ExamStateContext);
  const { exam, verification } = state;
  const { attempt, is_proctored: isProctored } = exam || {};
  let verificationStatus = verification.status || '';
  const { verification_url: verificationUrl } = attempt || {};

  // The API does not explicitly return 'expired' status, so we have to check manually.
  // expires attribute is returned only for approved status, so it is safe to do this
  // (meaning we won't override 'must_reverify' status for example)
  if (verification.expires && new Date() > new Date(verification.expires)) {
    verificationStatus = VerificationStatus.EXPIRED;
  }

  switch (true) {
    case isEmpty(attempt):
      return isProctored
        ? <EntranceProctoredExamInstructions />
        : <StartExamInstructions />;
    case attempt.attempt_status === ExamStatus.CREATED:
      return verificationStatus === VerificationStatus.APPROVED
        ? <DownloadSoftwareProctoredExamInstructions />
        : <VerificationProctoredExamInstructions status={verificationStatus} verificationUrl={verificationUrl} />;
    case attempt.attempt_status === ExamStatus.DOWNLOAD_SOFTWARE_CLICKED:
      return <DownloadSoftwareProctoredExamInstructions />;
    case attempt.attempt_status === ExamStatus.READY_TO_START:
      return <ReadyToStartProctoredExamInstructions />;
    case attempt.attempt_status === ExamStatus.READY_TO_SUBMIT:
      return isProctored
        ? <SubmitProctoredExamInstructions />
        : <SubmitExamInstructions />;
    case attempt.attempt_status === ExamStatus.SUBMITTED:
      return isProctored
        ? <SubmittedProctoredExamInstructions />
        : <SubmittedExamInstructions />;
    case attempt.attempt_status === ExamStatus.VERIFIED:
      return <VerifiedProctoredExamInstructions />;
    case attempt.attempt_status === ExamStatus.REJECTED:
      return <RejectedProctoredExamInstructions />;
    default:
      return children;
  }
};

Instructions.propTypes = {
  children: PropTypes.element.isRequired,
};

export default Instructions;
