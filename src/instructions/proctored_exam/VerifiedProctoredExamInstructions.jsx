import React from 'react';
import { FormattedMessage } from '@edx/frontend-platform/i18n';

const VerifiedProctoredExamInstructions = () => (
  <div>
    <h3 className="h3" data-testid="proctored-exam-instructions-title">
      <FormattedMessage
        id="exam.VerifiedProctoredExamInstructions.title"
        defaultMessage={'Exams are being reviewed and '
        + 'a final grade will be published soon.'}
      />
    </h3>
  </div>
);

export default VerifiedProctoredExamInstructions;
