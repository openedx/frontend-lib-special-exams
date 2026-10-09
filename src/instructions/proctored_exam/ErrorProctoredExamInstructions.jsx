import React from 'react';
import { FormattedMessage } from 'react-intl';
import { getConfig } from '@edx/frontend-platform';
import { Hyperlink, MailtoLink } from '@openedx/paragon';
import { useProctoringSettings } from '../../data';

const ErrorProctoredExamInstructions = () => {
  const { proctoring_escalation_email: proctoringEscalationEmail } = useProctoringSettings();

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
        values={{ supportLink: <Hyperlink destination={contactUsUrl} target="_blank">{platformName} Support</Hyperlink> }}
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
