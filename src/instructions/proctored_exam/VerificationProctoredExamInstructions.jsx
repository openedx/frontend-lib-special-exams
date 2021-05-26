import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { Button, Container } from '@edx/paragon';
import { VerificationStatus } from '../../constants';
import Footer from './Footer';

const VerificationProctoredExamInstructions = ({ status, verificationUrl }) => {
  const renderVerificationMessage = () => {
    switch (status) {
      case VerificationStatus.PENDING:
        return (
          <p>
            <FormattedMessage
              id="exam.VerificationPendingMessage"
              defaultMessage={'Your verification is pending. Results should '
              + 'be available 2-3 days after you submit your verification.'}
            />
          </p>
        );
      case VerificationStatus.MUST_REVERIFY:
        return (
          <>
            <p>
              <FormattedMessage
                id="exam.VerificationMustReverifyMessage"
                defaultMessage={'Your verification attempt failed. Please read '
                + 'our guidelines to make sure you understand the requirements '
                + 'for successfully completing verification, then try again.'}
              />
            </p>
            <Button
              data-testid="exam.VerificationProctoredExamInstructions-retry-button"
              variant="link"
              href={verificationUrl}
              target="_blank"
            >
              <FormattedMessage
                id="exam.VerificationProctoredExamInstructions.retryButton"
                defaultMessage="Retry Verification"
              />
            </Button>
          </>
        );
      case VerificationStatus.EXPIRED:
        return (
          <>
            <p>
              <FormattedMessage
                id="exam.VerificationExpiredMessage"
                defaultMessage={'Your verification has expired. You must successfully complete '
                + 'a new identity verification before you can start the proctored exam.'}
              />
            </p>
            <Button
              data-testid="exam.VerificationProctoredExamInstructions-continue-button"
              href={verificationUrl}
              target="_blank"
            >
              <FormattedMessage
                id="exam.VerificationProctoredExamInstructions.continueButton"
                defaultMessage="Continue to Verification"
              />
            </Button>
          </>
        );
      default:
        return (
          <>
            <p>
              <FormattedMessage
                id="exam.VerificationDefaultMessage"
                defaultMessage={'Make sure you are on a computer with a webcam, '
                + 'and that you have valid photo identification such as a driver\'s '
                + 'license or passport, before you continue.'}
              />
            </p>
            <Button
              data-testid="exam.VerificationProctoredExamInstructions-continue-button"
              href={verificationUrl}
              target="_blank"
            >
              <FormattedMessage
                id="exam.VerificationProctoredExamInstructions.continueButton"
                defaultMessage="Continue to Verification"
              />
            </Button>
          </>
        );
    }
  };

  return (
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
        {renderVerificationMessage()}
      </Container>
      <Footer />
    </div>
  );
};

VerificationProctoredExamInstructions.propTypes = {
  status: PropTypes.string.isRequired,
  verificationUrl: PropTypes.string,
};

VerificationProctoredExamInstructions.defaultProps = {
  verificationUrl: '',
};

export default VerificationProctoredExamInstructions;
