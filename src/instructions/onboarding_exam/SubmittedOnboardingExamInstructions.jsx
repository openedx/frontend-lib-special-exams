import React, { useContext } from 'react';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { Button, MailtoLink, useToggle } from '@edx/paragon';
import ExamStateContext from '../../context';

const SubmittedOnboardingExamInstructions = () => {
  const [isConfirm, confirm] = useToggle(false);
  const state = useContext(ExamStateContext);
  const { proctoringSettings, resetExam } = state;
  const {
    learner_notification_from_email: learnerNotificationFromEmail,
    integration_specific_email: integrationSpecificEmail,
  } = proctoringSettings || {};

  return (
    <div>
      <h3 className="h3" data-testid="exam-instructions-title">
        <FormattedMessage
          id="exam.SubmittedOnboardingExamInstructions.title"
          defaultMessage="You have submitted this onboarding exam"
        />
      </h3>
      <p>
        <FormattedMessage
          id="exam.SubmittedProctoredExamInstructions.text1"
          defaultMessage={'If you do not have an onboarding profile with the system, Verificient '
          + 'will review your submission and create an onboarding profile to grant you access to '
          + 'proctored exams. Onboarding profile review can take 2+ business days.'}
        />
      </p>
      <p>
        <FormattedMessage
          id="exam.SubmittedProctoredExamInstructions.text2"
          defaultMessage={'Once your profile has been reviewed, you will receive an email with '
          + 'review results. The email will come from '}
        />
        <MailtoLink to={learnerNotificationFromEmail}>
          {learnerNotificationFromEmail}
        </MailtoLink>
        <FormattedMessage
          id="exam.SubmittedProctoredExamInstructions.text3"
          defaultMessage={', so make sure this email has been added '
          + 'to your inbox filter.'}
        />
      </p>
      <p>
        <FormattedMessage
          id="exam.SubmittedProctoredExamInstructions.text4"
          defaultMessage={'If you do not have an onboarding profile with the system, Verificient '
          + 'will review your submission and create an onboarding profile to grant you access to '
          + 'proctored exams. Onboarding profile review can take 2+ business days.'}
        />
      </p>
      <p>
        <FormattedMessage
          id="exam.SubmittedProctoredExamInstructions.text5"
          defaultMessage={'If you already have an onboarding profile approved through another course, '
          + 'this submission will not be reviewed. You may retry this exam at any time to validate that '
          + 'your setup still meets the requirements for proctoring.'}
        />
      </p>
      <p>
        <Button variant="link" onClick={confirm}>
          <FormattedMessage
            id="exam.SubmittedProctoredExamInstructions.confirm"
            defaultMessage="I understand and want to reset this onboarding exam."
          />
        </Button>
      </p>
      <Button
        data-testid="retry-exam-button"
        variant="primary"
        onClick={resetExam}
        disabled={!isConfirm}
      >
        <FormattedMessage
          id="exam.ErrorOnboardingExamInstructions.retryExamButton"
          defaultMessage="Retry my exam"
        />
      </Button>
      <p className="mt-4">
        <FormattedMessage
          id="exam.SubmittedProctoredExamInstructions.text6"
          defaultMessage="Please contact "
        />
        <MailtoLink to={integrationSpecificEmail}>
          {integrationSpecificEmail}
        </MailtoLink>
        <FormattedMessage
          id="exam.SubmittedProctoredExamInstructions.text7"
          defaultMessage=" if you have questions."
        />
      </p>
    </div>
  );
};

export default SubmittedOnboardingExamInstructions;
