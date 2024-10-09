import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { Button } from '@openedx/paragon';

import { resetExam } from '../../data';

const SubmittedPracticeExamInstructions = () => {
  const dispatch = useDispatch();
  const { exam } = useSelector(state => state.specialExams);

  const examHasLtiProvider = !exam?.attempt?.use_legacy_attempt_api;

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
      {!examHasLtiProvider ? (
        <Button
          data-testid="retry-exam-button"
          variant="primary"
          onClick={() => dispatch(resetExam())}
        >
          <FormattedMessage
            id="exam.SubmittedPracticeExamInstructions.retryExamButton"
            defaultMessage="Retry my exam"
          />
        </Button>
      ) : null}
    </div>
  );
};

export default SubmittedPracticeExamInstructions;
