import React from 'react';
import PropTypes from 'prop-types';
import { Container } from '@openedx/paragon';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { ExamType } from '../constants';
import { RejectedOnboardingExamInstructions } from './onboarding_exam';
import { RejectedProctoredExamInstructions } from './proctored_exam';
import Footer from './proctored_exam/Footer';

const RejectedExamInstructions = ({ examType }) => {
  const renderInstructions = () => {
    switch (examType) {
      case ExamType.PROCTORED:
        return <RejectedProctoredExamInstructions />;
      case ExamType.PRACTICE:
        return <RejectedProctoredExamInstructions />;
      case ExamType.ONBOARDING:
        return <RejectedOnboardingExamInstructions />;
      default:
        return null;
    }
  };

  return (
    <div>
      <Container className="border py-5 mb-4 bg-danger-100">
        {renderInstructions()}
      </Container>
      {examType === ExamType.PROCTORED && (
        <div className="footer-sequence">
          <p className="ml-3 mb-3 text-gray-500">
            <FormattedMessage
              id="exam.RejectedProctoredExamInstructions.note"
              defaultMessage="If you have concerns about your proctoring session results, contact your course team."
            />
          </p>
        </div>
      )}
      <Footer />
    </div>
  );
};

RejectedExamInstructions.propTypes = {
  examType: PropTypes.string.isRequired,
};

export default RejectedExamInstructions;
