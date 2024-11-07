import React from 'react';
import PropTypes from 'prop-types';
import { Container } from '@openedx/paragon';
import { ExamType } from '../constants';
import { VerifiedOnboardingExamInstructions } from './onboarding_exam';
import { VerifiedProctoredExamInstructions } from './proctored_exam';
import Footer from './proctored_exam/Footer';

const VerifiedExamInstructions = ({ examType }) => {
  const renderInstructions = () => {
    switch (examType) {
      case ExamType.ONBOARDING:
        return <VerifiedOnboardingExamInstructions />;
      case ExamType.PRACTICE:
        return <VerifiedOnboardingExamInstructions />;
      case ExamType.PROCTORED:
        return <VerifiedProctoredExamInstructions />;
      default:
        return null;
    }
  };

  return (
    <div>
      <Container className="border py-5 mb-4">
        {renderInstructions()}
      </Container>
      {examType !== ExamType.TIMED && <Footer />}
    </div>
  );
};

VerifiedExamInstructions.propTypes = {
  examType: PropTypes.string.isRequired,
};

export default VerifiedExamInstructions;
