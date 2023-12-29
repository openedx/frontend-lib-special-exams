import React, { useContext } from 'react';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { Button, MailtoLink } from '@openedx/paragon';
import ExamStateContext from '../../context';

const RejectedOnboardingExamInstructions = () => {
  const state = useContext(ExamStateContext);
  const { proctoringSettings, resetExam } = state;
  const { integration_specific_email: integrationSpecificEmail } = proctoringSettings || {};

  return (
    <>
      <h3 className="h3" data-testid="rejected-onboarding-title">
        <FormattedMessage
          id="exam.RejectedOnboardingExamInstructions.title"
          defaultMessage="Your onboarding session was reviewed, but did not pass all requirements"
        />
      </h3>
      {integrationSpecificEmail && (
        <p data-testid="integration-email-contact">
          <FormattedMessage
            id="exam.RejectedOnboardingExamInstructions.text1"
            defaultMessage="Please contact "
          />
          <MailtoLink to={integrationSpecificEmail}>
            {integrationSpecificEmail}
          </MailtoLink>
          <FormattedMessage
            id="exam.RejectedOnboardingExamInstructions.text2"
            defaultMessage=' if you have questions. You may retake this onboarding exam by clicking "Retry my exam".'
          />
        </p>
      )}
      <Button
        data-testid="reset-exam-button"
        variant="primary"
        onClick={resetExam}
      >
        <FormattedMessage
          id="exam.RejectedOnboardingExamInstructions.resetExamButton"
          defaultMessage="Retry my exam"
        />
      </Button>
    </>
  );
};

export default RejectedOnboardingExamInstructions;
