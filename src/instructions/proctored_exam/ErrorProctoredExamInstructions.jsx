import React, { useContext } from 'react';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { Container, Hyperlink, MailtoLink } from '@edx/paragon';
import ExamStateContext from '../../context';
import Footer from './Footer';

const ErrorProctoredExamInstructions = () => {
  const state = useContext(ExamStateContext);
  const {
    link_urls: linkUrls,
    platform_name: platformName,
    proctoring_escalation_email: proctoringEscalationEmail,
  } = state.proctoringSettings || {};
  const contactUsUrl = linkUrls && linkUrls.contact_us;

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
      <Container className="border py-5 mb-4">
        <div className="h3">
          <FormattedMessage
            id="exam.ErrorProctoredExamInstructions.title"
            defaultMessage="Error with proctored exam"
          />
        </div>
        <p className="mb-0">
          {renderBody()}
        </p>
      </Container>
      <Footer />
    </div>
  );
};

export default ErrorProctoredExamInstructions;
