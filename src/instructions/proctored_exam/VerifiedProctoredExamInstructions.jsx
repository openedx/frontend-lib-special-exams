import React from 'react';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { Container } from '@edx/paragon';
import Footer from './Footer';

const VerifiedProctoredExamInstructions = () => (
  <div>
    <Container className="border py-5 mb-4 bg-success-100">
      <h3 className="h3" data-testid="exam-instructions-title">
        <FormattedMessage
          id="exam.VerifiedProctoredExamInstructions.title"
          defaultMessage={'Your proctoring session was reviewed successfully. '
          + 'Go to your progress page to view your exam grade.'}
        />
      </h3>
    </Container>
    <Footer />
  </div>
);

export default VerifiedProctoredExamInstructions;
