import React from 'react';
import { FormattedMessage } from '@edx/frontend-platform/i18n';

const TimedExamFooter = () => (
  <div className="footer-sequence">
    <div className="h4">
      <FormattedMessage
        id="exam.startExamInstructions.footerTitle"
        defaultMessage="Can I request additional time to complete my exam?"
      />
    </div>
    <p>
      <FormattedMessage
        id="exam.startExamInstructions.footerText"
        defaultMessage={'If you have disabilities, '
        + 'you might be eligible for an additional time allowance on timed exams. '
        + 'Ask your course team for information about additional time allowances.'}
      />
    </p>
  </div>
);

export default TimedExamFooter;
