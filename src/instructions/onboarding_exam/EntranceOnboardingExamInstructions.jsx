import React, { useContext } from 'react';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { Button, MailtoLink } from '@edx/paragon';
import ExamStateContext from '../../context';

const EntranceOnboardingExamInstructions = () => {
  const state = useContext(ExamStateContext);
  const { createProctoredExamAttempt, proctoringSettings } = state;
  const {
    provider_name: providerName,
    learner_notification_from_email: learnerNotificationFromEmail,
    integration_specific_email: integrationSpecificEmail,
  } = proctoringSettings || {};

  return (
    <>
      <div className="h3" data-testid="exam-instructions-title">
        <FormattedMessage
          id="exam.EntranceOnboardingExamInstructions.title"
          defaultMessage="Proctoring onboarding exam"
        />
      </div>
      <p>
        <FormattedMessage
          id="exam.EntranceOnboardingExamInstructions.text1"
          defaultMessage="Why this is important to you:"
        />
      </p>
      <ul>
        <li>
          <FormattedMessage
            id="exam.EntranceOnboardingExamInstructions.listItem1"
            defaultMessage="Establish your identity with the proctoring system to take a proctored exam"
          />
        </li>
        <li>
          <FormattedMessage
            id="exam.EntranceOnboardingExamInstructions.listItem2"
            defaultMessage="Create your onboarding profile for faster access in the future"
          />
        </li>
        <li>
          <FormattedMessage
            id="exam.EntranceOnboardingExamInstructions.listItem3"
            defaultMessage="Practice taking a proctored test"
          />
        </li>
      </ul>
      <p>
        <FormattedMessage
          id="exam.EntranceOnboardingExamInstructions.text2"
          defaultMessage={'Proctoring for this course is provided via {providerName}. '
          + 'Onboarding review, including identity verification, can take 2+ business days.'}
          values={{ providerName }}
        />
      </p>
      {learnerNotificationFromEmail && (
        <p data-testid="learner-notification-email-contact">
          <FormattedMessage
            id="exam.EntranceOnboardingExamInstructions.text3"
            defaultMessage={'Once your profile has been reviewed, you will receive an email '
            + 'with review results. The email will come from '}
          />
          <MailtoLink to={learnerNotificationFromEmail}>
            {learnerNotificationFromEmail}
          </MailtoLink>
          <FormattedMessage
            id="exam.EntranceOnboardingExamInstructions.text4"
            defaultMessage=" Make sure this email has been added to your inbox filter."
          />
        </p>
      )}
      {integrationSpecificEmail && (
        <p data-testid="integration-email-contact">
          <FormattedMessage
            id="exam.EntranceOnboardingExamInstructions.text5"
            defaultMessage="Please contact "
          />
          <MailtoLink to={integrationSpecificEmail}>
            {integrationSpecificEmail}
          </MailtoLink>
          <FormattedMessage
            id="exam.EntranceOnboardingExamInstructions.text6"
            defaultMessage=" if you have questions."
          />
        </p>
      )}
      <p className="pl-4 m-md-0">
        <Button
          data-testid="start-exam-button"
          variant="primary"
          onClick={createProctoredExamAttempt}
        >
          <FormattedMessage
            id="exam.EntranceOnboardingExamInstructions.startExamButtonText"
            defaultMessage="Continue to onboarding"
          />
        </Button>
      </p>
      <p className="pl-md-4">
        <FormattedMessage
          id="exam.EntranceOnboardingExamInstructions.text7"
          defaultMessage="You will be guided through online proctoring software set up and identity verification."
        />
      </p>
    </>
  );
};

export default EntranceOnboardingExamInstructions;
