import React from 'react';
import { useDispatch } from 'react-redux';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { Button } from '@edx/paragon';

import { resetExam } from '../../data';

const ErrorPracticeExamInstructions = () => {
  const dispatch = useDispatch();

  return (
    <div>
      <h3 className="h3">
        <FormattedMessage
          id="exam.ErrorPracticeExamInstructions.title"
          defaultMessage="There was a problem with your practice proctoring session"
        />
      </h3>
      <h4 className="h4">
        <FormattedMessage
          id="exam.ErrorPracticeExamInstructions.title2"
          defaultMessage="Your practice proctoring results: "
        />
        <span className="font-weight-bold">
          <FormattedMessage
            id="exam.ErrorPracticeExamInstructions.title2.result"
            defaultMessage="Unsatisfactory"
          />
        </span>
      </h4>
      <p className="mb-0">
        <FormattedMessage
          id="exam.ErrorPracticeExamInstructions.text"
          defaultMessage={'Your proctoring session ended before you completed this practice exam. '
          + 'You can retry this practice exam if you had problems setting up the online proctoring software.'}
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

export default ErrorPracticeExamInstructions;
