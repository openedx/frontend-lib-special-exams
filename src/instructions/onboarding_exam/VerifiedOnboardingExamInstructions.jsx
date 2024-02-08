import React from 'react';
import { useSelector } from 'react-redux';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { MailtoLink } from '@edx/paragon';

const VerifiedOnboardingExamInstructions = () => {
  const { proctoringSettings } = useSelector(state => state.specialExams);

  const {
    integration_specific_email: integrationSpecificEmail,
  } = proctoringSettings || {};

  return (
    <div>
      <h3 className="h3" data-testid="exam-instructions-title">
        <FormattedMessage
          id="exam.VerifiedOnboardingExamInstructions.title"
          defaultMessage="Your onboarding profile was reviewed successfully"
        />
      </h3>
      <p>
        <FormattedMessage
          id="exam.VerifiedOnboardingExamInstructions.text"
          defaultMessage={'Your profile has been established, and you\'re ready '
          + 'to take proctored exams in this course'}
        />
      </p>
      <p>
        <FormattedMessage
          id="exam.VerifiedOnboardingExamInstructions.helpText1"
          defaultMessage="Please contact "
        />
        <MailtoLink to={integrationSpecificEmail}>
          {integrationSpecificEmail}
        </MailtoLink>
        <FormattedMessage
          id="exam.VerifiedOnboardingExamInstructions.helpText2"
          defaultMessage=" if you have questions."
        />
      </p>
    </div>
  );
};

export default VerifiedOnboardingExamInstructions;
