import React from 'react';
import { useSelector } from 'react-redux';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { getConfig } from '@edx/frontend-platform';
import { Hyperlink, MailtoLink } from '@openedx/paragon';

const ErrorProctoredExamInstructions = () => {
  const { proctoring_escalation_email: proctoringEscalationEmail } = useSelector(
    state => state.specialExams?.proctoringSettings,
  ) || {};

  const platformName = getConfig().SITE_NAME;
  const contactUsUrl = getConfig().CONTACT_URL;

  const renderBody = () => {
    if (proctoringEscalationEmail) {
      return (
        <FormattedMessage
          id="exam.ErrorProctoredExamInstructions.text1"
          defaultMessage={'A system error has occurred with your proctored exam. '
          + 'Please reach out to your course team at {supportLink} for assistance, '
          + 'and return to the exam once you receive further instructions.'}
          values={{ supportLink: <MailtoLink to={proctoringEscalationEmail}>{proctoringEscalationEmail}</MailtoLink> }}
        />
      );
    }

    return (
      <FormattedMessage
        id="exam.ErrorProctoredExamInstructions.text2"
        defaultMessage={'A system error has occurred with your proctored exam. '
        + 'Please reach out to {supportLink} for assistance, and return to '
        + 'the exam once you receive further instructions.'}
        values={{ supportLink: <Hyperlink href={contactUsUrl} target="_blank">{platformName} Support</Hyperlink> }}
      />
    );
  };

  return (
    <div>
      <div className="h3">
        <FormattedMessage
          id="exam.ErrorProctoredExamInstructions.title"
          defaultMessage="Error with proctored exam"
        />
      </div>
      <p className="mb-0">
        {renderBody()}
      </p>
    </div>
  );
};

export default ErrorProctoredExamInstructions;
