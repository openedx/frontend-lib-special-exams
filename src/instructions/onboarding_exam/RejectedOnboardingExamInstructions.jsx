import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { Button, MailtoLink } from '@edx/paragon';

import { resetExam } from '../../data';

const RejectedOnboardingExamInstructions = () => {
  const { proctoringSettings } = useSelector(state => state.specialExams);

  const dispatch = useDispatch();

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
        onClick={() => dispatch(resetExam())}
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
