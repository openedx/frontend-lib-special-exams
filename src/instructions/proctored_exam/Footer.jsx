import React from 'react';
import { Button } from '@openedx/paragon';
import { FormattedMessage } from 'react-intl';
import { useSpecialExams } from '../../core/SpecialExamsProvider';

const Footer = () => {
  const faqUrl = useSpecialExams().config.proctoredExamFaqUrl;

  return (
    <div className="footer-sequence">
      {faqUrl && (
        <Button
          data-testid="request-exam-time-button"
          variant="link"
          href={faqUrl}
          target="_blank"
        >
          <FormattedMessage
            id="exam.startExamInstructions.footerButton"
            defaultMessage="About Proctored Exams"
          />
        </Button>
      )}
    </div>
  );
};

export default Footer;
