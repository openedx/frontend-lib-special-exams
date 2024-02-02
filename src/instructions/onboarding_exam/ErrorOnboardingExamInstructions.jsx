import React from 'react';
import { useDispatch } from 'react-redux';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { Button } from '@edx/paragon';

import { resetExam } from '../../data';

const ErrorOnboardingExamInstructions = () => {
  const dispatch = useDispatch();

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
        onClick={() => dispatch(resetExam())}
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
