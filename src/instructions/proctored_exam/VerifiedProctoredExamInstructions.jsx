import React from 'react';
import { FormattedMessage } from '@edx/frontend-platform/i18n';

const VerifiedProctoredExamInstructions = () => (
  <div>
    <h3 className="h3" data-testid="proctored-exam-instructions-title">
      <FormattedMessage
        id="exam.VerifiedProctoredExamInstructions.title"
        defaultMessage={'Your proctoring session was reviewed successfully. '
        + 'Go to your progress page to view your exam grade.'}
      />
    </h3>
  </div>
);

export default VerifiedProctoredExamInstructions;
