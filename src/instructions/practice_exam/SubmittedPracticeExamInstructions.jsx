import React, { useContext } from 'react';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { Button } from '@openedx/paragon';
import ExamStateContext from '../../context';

const SubmittedPracticeExamInstructions = () => {
  const state = useContext(ExamStateContext);
  const { resetExam } = state;

  return (
    <div>
      <h3 className="h3" data-testid="exam-instructions-title">
        <FormattedMessage
          id="exam.SubmittedOnboardingExamInstructions.title"
          defaultMessage="You have submitted this practice proctored exam"
        />
      </h3>
      <p>
        <FormattedMessage
          id="exam.SubmittedProctoredExamInstructions.text1"
          defaultMessage={'Practice exams do not affect your grade. You have '
          + 'completed this practice exam and can continue with your course work.'}
        />
      </p>
      <Button
        data-testid="retry-exam-button"
        variant="primary"
        onClick={resetExam}
      >
        <FormattedMessage
          id="exam.SubmittedPracticeExamInstructions.retryExamButton"
          defaultMessage="Retry my exam"
        />
      </Button>
    </div>
  );
};

export default SubmittedPracticeExamInstructions;
