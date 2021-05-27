import React, { useContext } from 'react';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { Button } from '@edx/paragon';
import ExamStateContext from '../../context';

const EntranceOnboardingExamInstructions = () => {
  const state = useContext(ExamStateContext);
  const { startProctoringExam, proctoringSettings } = state;
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
      <p className="mt-4 pl-md-4">
        <FormattedMessage
          id="exam.EntrancePracticeExamInstructions.text2"
          defaultMessage={'Proctoring for this course is provided via {providerName}. '
          + 'Onboarding review, including identity verification, can take 2+ business days.'}
          values={{ providerName }}
        />
      </p>
      {learnerNotificationFromEmail && (
        <p>
          <FormattedMessage
            id="exam.EntrancePracticeExamInstructions.text3"
            defaultMessage={'Once your profile has been reviewed, you will receive an email '
            + 'with review results. The email will come from'}
          />
          &nbsp
          <Button
            variant="link"
            href={`mailto:${learnerNotificationFromEmail}`}
          >
            {learnerNotificationFromEmail}
          </Button>
          &nbsp
          <FormattedMessage
            id="exam.EntrancePracticeExamInstructions.text4"
            defaultMessage="Make sure this email has been added to your inbox filter."
          />
        </p>
      )}
      {integrationSpecificEmail && (
        <p>
          <FormattedMessage
            id="exam.EntrancePracticeExamInstructions.text5"
            defaultMessage="Please contact"
          />
          &nbsp;
          <Button
            variant="link"
            href={`mailto:${integrationSpecificEmail}`}
          >
            {integrationSpecificEmail}
          </Button>
          &nbsp;
          <FormattedMessage
            id="exam.EntrancePracticeExamInstructions.text6"
            defaultMessage="if you have questions."
          />
        </p>
      )}
      <p className="pl-md-4">
        <Button
          data-testid="start-exam-button"
          variant="primary"
          onClick={startProctoringExam}
        >
          <FormattedMessage
            id="exam.EntrancePracticeExamInstructions.startExamButtonText"
            defaultMessage="Continue to onboarding"
          />
        </Button>
      </p>
      <p className="mt-4 pl-md-4">
        <FormattedMessage
          id="exam.EntrancePracticeExamInstructions.text2"
          defaultMessage="You will be guided through online proctoring software set up and identity verification."
        />
      </p>
    </>
  );
};

export default EntranceOnboardingExamInstructions;
