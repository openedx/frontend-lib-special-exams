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
} from './proctored_exam';
import { isEmpty } from '../helpers';
import { ExamStatus } from '../constants';
import ExamStateContext from '../context';

const Instructions = ({ children }) => {
  const state = useContext(ExamStateContext);
  const { attempt, is_proctored: isProctored } = state.exam;

  switch (true) {
    case isEmpty(attempt):
      return isProctored
        ? <EntranceProctoredExamInstructions />
        : <StartExamInstructions />;
    case attempt.attempt_status === ExamStatus.CREATED:
      return <DownloadSoftwareProctoredExamInstructions />;
    case attempt.attempt_status === ExamStatus.DOWNLOAD_SOFTWARE_CLICKED:
      return <DownloadSoftwareProctoredExamInstructions />;
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
