import React, { useContext } from 'react';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { Container, MailtoLink, Hyperlink } from '@edx/paragon';
import ExamStateContext from '../../context';
import { ExamStatus } from '../../constants';
import Footer from './Footer';

const OnboardingErrorProctoredExamInstructions = () => {
  const state = useContext(ExamStateContext);
  const { exam, proctoringSettings } = state;
  const { attempt, onboarding_link: onboardingLink } = exam;
  const {
    integration_specific_email: integrationSpecificEmail,
    provider_name: providerName,
  } = proctoringSettings;

  const renderBody = () => {
    switch (attempt.attempt_status) {
      case ExamStatus.ONBOARDING_MISSING:
      case ExamStatus.ONBOARDING_EXPIRED:
        return (
          <>
            <p data-testid="onboarding_missing">
              <FormattedMessage
                id="exam.OnboardingErrorProctoredExamInstructions.missingText"
                defaultMessage="Please complete an onboarding exam before attempting this exam."
              />
            </p>
            {onboardingLink && (
              <Hyperlink href={onboardingLink}>
                <FormattedMessage
                  id="exam.OnboardingErrorProctoredExamInstructions.onboardingButtonText"
                  defaultMessage="Navigate to onboarding exam"
                />
              </Hyperlink>
            )}
          </>
        );
      case ExamStatus.ONBOARDING_PENDING:
        return (
          <p data-testid="onboarding_pending">
            <FormattedMessage
              id="exam.OnboardingErrorProctoredExamInstructions.pendingText"
              defaultMessage={'Your onboarding exam is being reviewed. Before attempting this exam,'
              + ' please allow 2+ business days for your onboarding exam to be reviewed.'}
            />
          </p>
        );
      case ExamStatus.ONBOARDING_FAILED:
        return (
          <>
            <p data-testid="onboarding_failed">
              <FormattedMessage
                id="exam.OnboardingErrorProctoredExamInstructions.failedText"
                defaultMessage="Your onboarding exam failed to pass all requirements."
              />
            </p>
            {onboardingLink && (
              <Hyperlink href={onboardingLink}>
                <FormattedMessage
                  id="exam.OnboardingErrorProctoredExamInstructions.onboardingButtonText"
                  defaultMessage="Navigate to onboarding exam"
                />
              </Hyperlink>
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <Container className="border py-5 mb-4">
        <div className="h3">
          <FormattedMessage
            id="exam.OnboardingErrorProctoredExamInstructions.title"
            defaultMessage="You must complete an onboarding exam before taking this proctored exam"
          />
        </div>
        {renderBody()}
        {integrationSpecificEmail && (
          <p className="pt-2">
            <FormattedMessage
              id="exam.OnboardingErrorProctoredExamInstructions.providerInfo"
              defaultMessage={'Proctoring for your exam is provided via {providerName}. '
              + 'If you have questions about the status of your onboarding exam, contact '}
              values={{ providerName }}
            />
            <MailtoLink to={integrationSpecificEmail}>
              {integrationSpecificEmail}
            </MailtoLink>
          </p>
        )}
      </Container>
      <Footer />
    </div>
  );
};

export default OnboardingErrorProctoredExamInstructions;
