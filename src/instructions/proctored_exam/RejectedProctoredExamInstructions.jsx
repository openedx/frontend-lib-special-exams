import React from 'react';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { Button, Container } from '@edx/paragon';

const RejectedProctoredExamInstructions = () => (
  <div>
    <Container className="border py-5 mb-4 bg-danger-100">
      <h3 className="h3" data-testid="exam-instructions-title">
        <FormattedMessage
          id="exam.RejectedProctoredExamInstructions.title"
          defaultMessage="Your proctoring session was reviewed, but did not pass all requirements"
        />
      </h3>
      <p className="mb-0">
        <FormattedMessage
          id="exam.RejectedProctoredExamInstructions.description"
          defaultMessage="If you have questions about the status of your proctoring session results, contact platform Support."
        />
      </p>
    </Container>

    <div className="footer-sequence">
      <p className="ml-3 mb-3 text-gray-500">
        <FormattedMessage
          id="exam.RejectedProctoredExamInstructions.note"
          defaultMessage="If you have concerns about your proctoring session results, contact your course team."
        />
      </p>
      <Button
        data-testid="request-exam-time-button"
        variant="link"
        onClick={() => {}}
      >
        <FormattedMessage
          id="exam.RejectedProctoredExamInstructions.footerButton"
          defaultMessage="About Proctored Exams"
        />
      </Button>
    </div>
  </div>
);

export default RejectedProctoredExamInstructions;
