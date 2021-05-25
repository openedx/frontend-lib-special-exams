import React from 'react';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { Button, Container } from '@edx/paragon';

const VerificationProctoredExamInstructions = () => (
  <div>
    <Container className="border py-5 mb-4">
      <div className="h3" data-testid="exam-instructions-title">
        <FormattedMessage
          id="exam.VerificationProctoredExamInstructions.title"
          defaultMessage="Complete your verification before starting the proctored exam."
        />
      </div>
      <p>
        <FormattedMessage
          id="exam.VerificationProctoredExamInstructions.text1"
          defaultMessage="You must successfully complete identity verification before you can start the proctored exam."
        />
      </p>
      <p>
        <FormattedMessage
          id="exam.VerificationProctoredExamInstructions.text2"
          defaultMessage={'Make sure you are on a computer with a webcam, and that you have valid photo '
          + "identification such as a driver's license or passport, before you continue."}
        />
      </p>
      <Button
        data-testid="exam.VerificationProctoredExamInstructions-continue-button"
        variant="outline-secondary"
        onClick={() => {}}
      >
        <FormattedMessage
          id="exam.VerificationProctoredExamInstructions.continueButton"
          defaultMessage="Continue to Verification"
        />
      </Button>
    </Container>

    <div className="footer-sequence">
      <Button
        data-testid="request-exam-time-button"
        variant="link"
        onClick={() => {}}
      >
        <FormattedMessage
          id="exam.startExamInstructions.footerButton"
          defaultMessage="About Proctored Exams"
        />
      </Button>
    </div>
  </div>
);

export default VerificationProctoredExamInstructions;
