import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import SubmittedExamInstructions from './SubmittedExamInstructions';
import {
  ErrorProctoredExamInstructions,
  VerificationProctoredExamInstructions,
  SubmittedProctoredExamInstructions,
  VerifiedProctoredExamInstructions,
  DownloadSoftwareProctoredExamInstructions,
  ReadyToStartProctoredExamInstructions,
  PrerequisitesProctoredExamInstructions,
  SkipProctoredExamInstruction,
} from './proctored_exam';
import { isEmpty } from '../helpers';
import { ExamStatus, VerificationStatus, ExamType } from '../constants';
import ExamStateContext from '../context';
import EntranceExamInstructions from './EntranceInstructions';
import SubmitExamInstructions from './SubmitInstructions';
import RejectedInstructions from './RejectedInstructions';

const Instructions = ({ children }) => {
  const state = useContext(ExamStateContext);
  const { exam, verification } = state;
  const { attempt, type: examType, prerequisite_status: prerequisitesData } = exam || {};
  const prerequisitesPassed = prerequisitesData ? prerequisitesData.are_prerequisites_satisifed : true;
  let verificationStatus = verification.status || '';
  const { verification_url: verificationUrl } = attempt || {};
  const [skipProctoring, toggleSkipProctoring] = useState(false);
  const toggleSkipProctoredExam = () => toggleSkipProctoring(!skipProctoring);

  // The API does not explicitly return 'expired' status, so we have to check manually.
  // expires attribute is returned only for approved status, so it is safe to do this
  // (meaning we won't override 'must_reverify' status for example)
  if (verification.expires && new Date() > new Date(verification.expires)) {
    verificationStatus = VerificationStatus.EXPIRED;
  }

  switch (true) {
    case isEmpty(attempt):
      // eslint-disable-next-line no-nested-ternary
      return examType === ExamType.PROCTORED
        // eslint-disable-next-line no-nested-ternary
        ? skipProctoring
          ? <SkipProctoredExamInstruction cancelSkipProctoredExam={toggleSkipProctoredExam} />
          : prerequisitesPassed
            ? <EntranceExamInstructions examType={examType} skipProctoredExam={toggleSkipProctoredExam} />
            : <PrerequisitesProctoredExamInstructions skipProctoredExam={toggleSkipProctoredExam} />
        : <EntranceExamInstructions examType={examType} skipProctoredExam={toggleSkipProctoredExam} />;
    case attempt.attempt_status === ExamStatus.CREATED:
      return verificationStatus === VerificationStatus.APPROVED
        ? <DownloadSoftwareProctoredExamInstructions />
        : <VerificationProctoredExamInstructions status={verificationStatus} verificationUrl={verificationUrl} />;
    case attempt.attempt_status === ExamStatus.DOWNLOAD_SOFTWARE_CLICKED:
      return <DownloadSoftwareProctoredExamInstructions />;
    case attempt.attempt_status === ExamStatus.READY_TO_START:
      return <ReadyToStartProctoredExamInstructions />;
    case attempt.attempt_status === ExamStatus.READY_TO_SUBMIT:
      return <SubmitExamInstructions examType={examType} />;
    case attempt.attempt_status === ExamStatus.SUBMITTED:
      return examType === ExamType.PROCTORED
        ? <SubmittedProctoredExamInstructions />
        : <SubmittedExamInstructions />;
    case attempt.attempt_status === ExamStatus.VERIFIED:
      return <VerifiedProctoredExamInstructions />;
    case attempt.attempt_status === ExamStatus.REJECTED:
      return <RejectedInstructions examType={examType} />;
    case attempt.attempt_status === ExamStatus.ERROR:
      return <ErrorProctoredExamInstructions />;
    case attempt.attempt_status === ExamStatus.READY_TO_RESUME:
      return <EntranceExamInstructions examType={examType} skipProctoredExam={toggleSkipProctoredExam} />;
    default:
      return children;
  }
};

Instructions.propTypes = {
  children: PropTypes.element.isRequired,
};

export default Instructions;
