import React from 'react';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { Button, Container } from '@edx/paragon';

const VerifiedProctoredExamInstructions = () => (
  <div>
    <Container className="border py-5 mb-4 bg-success-100">
      <h3 className="h3" data-testid="proctored-exam-instructions-title">
        <FormattedMessage
          id="exam.VerifiedProctoredExamInstructions.title"
          defaultMessage={'Your proctoring session was reviewed successfully. '
          + 'Go to your progress page to view your exam grade.'}
        />
      </h3>
    </Container>

    <div className="footer-sequence">
      <Button
        data-testid="request-exam-time-button"
        variant="link"
        onClick={() => {}}
      >
        <FormattedMessage
          id="exam.VerifiedProctoredExamInstructions.footerButton"
          defaultMessage="About Proctored Exams"
        />
      </Button>
    </div>
  </div>
);

export default VerifiedProctoredExamInstructions;
