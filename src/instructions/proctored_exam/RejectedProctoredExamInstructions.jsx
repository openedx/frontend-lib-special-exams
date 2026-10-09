import React from 'react';
import { FormattedMessage } from 'react-intl';
import { useSpecialExams } from '../../core/SpecialExamsProvider';

const RejectedProctoredExamInstructions = () => {
  const platformName = useSpecialExams().config.siteName;

  return (
    <>
      <h3 className="h3" data-testid="proctored-exam-instructions-title">
        <FormattedMessage
          id="exam.RejectedProctoredExamInstructions.title"
          defaultMessage="Your proctoring session was reviewed, but did not pass all requirements"
        />
      </h3>
      <p className="mb-0">
        <FormattedMessage
          id="exam.RejectedProctoredExamInstructions.description"
          defaultMessage={'If you have questions about the status of '
          + 'your proctoring session results, contact {platformName} Support.'}
          values={{ platformName }}
        />
      </p>
    </>
  );
};

export default RejectedProctoredExamInstructions;
