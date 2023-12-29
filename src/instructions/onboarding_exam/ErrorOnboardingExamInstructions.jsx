import React, { useContext } from 'react';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { Button } from '@openedx/paragon';
import ExamStateContext from '../../context';

const ErrorOnboardingExamInstructions = () => {
  const state = useContext(ExamStateContext);
  const { resetExam } = state;

  return (
    <div>
      <h3 className="h3">
        <FormattedMessage
          id="exam.ErrorOnboardingExamInstructions.title"
          defaultMessage="Error: There was a problem with your onboarding session"
        />
      </h3>
      <p className="mb-0">
        <FormattedMessage
          id="exam.ErrorOnboardingExamInstructions.text"
          defaultMessage={'Your proctoring session ended before you completed this '
          + 'onboarding exam. You should retry this onboarding exam'}
        />
      </p>
      <Button
        data-testid="retry-exam-button"
        variant="primary"
        onClick={resetExam}
      >
        <FormattedMessage
          id="exam.ErrorOnboardingExamInstructions.retryExamButton"
          defaultMessage="Retry my exam"
        />
      </Button>
    </div>
  );
};

export default ErrorOnboardingExamInstructions;
