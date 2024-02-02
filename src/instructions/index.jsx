import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  DownloadSoftwareProctoredExamInstructions,
  ReadyToStartProctoredExamInstructions,
  PrerequisitesProctoredExamInstructions,
  SkipProctoredExamInstruction,
  OnboardingErrorProctoredExamInstructions,
} from './proctored_exam';
import { isEmpty, shouldRenderExpiredPage } from '../helpers';
import {
  ExamStatus,
  ExamType,
  IS_ONBOARDING_ERROR,
} from '../constants';
import EntranceExamInstructions from './EntranceInstructions';
import SubmitExamInstructions from './SubmitInstructions';
import RejectedInstructions from './RejectedInstructions';
import ErrorExamInstructions from './ErrorInstructions';
import SubmittedExamInstructions from './SubmittedInstructions';
import VerifiedExamInstructions from './VerifiedInstructions';
import ExpiredInstructions from './ExpiredInstructions';
import UnknownAttemptStatusError from './UnknownAttemptStatusError';

const Instructions = ({ children }) => {
  const { exam } = useSelector(state => state.specialExams);
  const {
    attempt,
    type: examType,
    prerequisite_status: prerequisitesData,
    passed_due_date: passedDueDate,
    hide_after_due: hideAfterDue,
  } = exam || {};
  const prerequisitesPassed = prerequisitesData ? prerequisitesData.are_prerequisites_satisifed : true;
  const {
    attempt_status: attemptStatus,
    attempt_ready_to_resume: attemptReadyToResume,
  } = attempt || {};
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

  switch (true) {
    case examType === ExamType.PROCTORED && skipProctoring:
      return <SkipProctoredExamInstruction cancelSkipProctoredExam={toggleSkipProctoredExam} />;
    case isEmpty(attempt) || !attempt.attempt_id:
      return renderEmptyAttemptInstructions();
    case attemptReadyToResume:
      return <EntranceExamInstructions examType={examType} skipProctoredExam={toggleSkipProctoredExam} />;
    case attemptStatus === ExamStatus.CREATED:
      return <DownloadSoftwareProctoredExamInstructions skipProctoredExam={toggleSkipProctoredExam} />;
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
