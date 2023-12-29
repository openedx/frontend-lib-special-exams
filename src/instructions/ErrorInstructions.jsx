import React from 'react';
import PropTypes from 'prop-types';
import { Container } from '@openedx/paragon';
import { ExamType } from '../constants';
import { ErrorPracticeExamInstructions } from './practice_exam';
import { ErrorOnboardingExamInstructions } from './onboarding_exam';
import { ErrorProctoredExamInstructions } from './proctored_exam';
import Footer from './proctored_exam/Footer';

const ErrorExamInstructions = ({ examType }) => {
  const renderInstructions = () => {
    switch (examType) {
      case ExamType.ONBOARDING:
        return <ErrorOnboardingExamInstructions />;
      case ExamType.PRACTICE:
        return <ErrorPracticeExamInstructions />;
      case ExamType.PROCTORED:
        return <ErrorProctoredExamInstructions />;
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

ErrorExamInstructions.propTypes = {
  examType: PropTypes.string.isRequired,
};

export default ErrorExamInstructions;
