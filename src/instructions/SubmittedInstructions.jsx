import React from 'react';
import PropTypes from 'prop-types';
import { Container } from '@openedx/paragon';
import { ExamType } from '../constants';
import { SubmittedPracticeExamInstructions } from './practice_exam';
import { SubmittedProctoredExamInstructions } from './proctored_exam';
import { SubmittedOnboardingExamInstructions } from './onboarding_exam';
import { SubmittedTimedExamInstructions } from './timed_exam';
import Footer from './proctored_exam/Footer';

const SubmittedExamInstructions = ({ examType }) => {
  const renderInstructions = () => {
    switch (examType) {
      case ExamType.ONBOARDING:
        return <SubmittedOnboardingExamInstructions />;
      case ExamType.PRACTICE:
        return <SubmittedPracticeExamInstructions />;
      case ExamType.PROCTORED:
        return <SubmittedProctoredExamInstructions />;
      case ExamType.TIMED:
        return <SubmittedTimedExamInstructions />;
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

SubmittedExamInstructions.propTypes = {
  examType: PropTypes.string.isRequired,
};

export default SubmittedExamInstructions;
