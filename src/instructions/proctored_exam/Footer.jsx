import React, { useContext } from 'react';
import { Button } from '@edx/paragon';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import ExamStateContext from '../../context';

const Footer = () => {
  const state = useContext(ExamStateContext);
  const { proctoringSettings } = state;
  const { link_urls: linkUrls } = proctoringSettings;
  const faqUrl = linkUrls && linkUrls.faq;

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
