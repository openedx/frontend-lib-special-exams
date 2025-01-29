import React from 'react';
import { FormattedMessage } from '@edx/frontend-platform/i18n';

const SubmittedProctoredExamInstructions = () => (
  <div>
    <h3 className="h3" data-testid="proctored-exam-instructions-title">
      <FormattedMessage
        id="exam.SubmittedProctoredExamInstructions.title"
        defaultMessage="You have submitted this proctored exam for review"
      />
    </h3>
    <ul>
      <li>
        <FormattedMessage
          id="exam.SubmittedProctoredExamInstructions.list1"
          defaultMessage="Your recorded data should now be uploaded for review."
        />
        <ul>
          <li>
            <FormattedMessage
              id="exam.SubmittedProctoredExamInstructions.list2"
              defaultMessage={'If the proctoring software window is still open, close it now and '
              + 'confirm that you want to quit the application.'}
            />
          </li>
        </ul>
      </li>
      <li>
        <FormattedMessage
          id="exam.SubmittedProctoredExamInstructions.list3"
          defaultMessage={'Proctoring results are usually available within 5 business days '
          + 'after you submit your exam. Final grades may take longer.'}
        />

      </li>
    </ul>
    <p className="mb-0">
      <FormattedMessage
        id="exam.SubmittedProctoredExamInstructions.text"
        defaultMessage={'If you have questions about the status of your proctored exam results, '
        + 'contact platform Support.'}
      />
    </p>
  </div>
);

export default SubmittedProctoredExamInstructions;
