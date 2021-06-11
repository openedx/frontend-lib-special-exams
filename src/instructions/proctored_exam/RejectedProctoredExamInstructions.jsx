import React, { useContext } from 'react';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import ExamStateContext from '../../context';

const RejectedProctoredExamInstructions = () => {
  const state = useContext(ExamStateContext);
  const { proctoringSettings } = state;
  const { platform_name: platformName } = proctoringSettings;

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
