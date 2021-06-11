import React from 'react';
import PropTypes from 'prop-types';
import { Container } from '@edx/paragon';
import { ExamType } from '../constants';
import { EntranceProctoredExamInstructions } from './proctored_exam';
import { EntranceOnboardingExamInstructions } from './onboarding_exam';
import EntrancePracticeExamInstructions from './practice_exam';
import { StartTimedExamInstructions, TimedExamFooter } from './timed_exam';
import Footer from './proctored_exam/Footer';

const EntranceExamInstructions = ({ examType, skipProctoredExam }) => {
  const renderInstructions = () => {
    switch (examType) {
      case ExamType.PROCTORED:
        return <EntranceProctoredExamInstructions skipProctoredExam={skipProctoredExam} />;
      case ExamType.ONBOARDING:
        return <EntranceOnboardingExamInstructions />;
      case ExamType.PRACTICE:
        return <EntrancePracticeExamInstructions />;
      case ExamType.TIMED:
        return <StartTimedExamInstructions />;
      default:
        return null;
    }
  };

  return (
    <div>
      <Container className="border py-5 mb-4">
        {renderInstructions()}
      </Container>
      {examType === ExamType.TIMED
        ? <TimedExamFooter />
        : <Footer />}
    </div>
  );
};

EntranceExamInstructions.propTypes = {
  examType: PropTypes.string.isRequired,
  skipProctoredExam: PropTypes.func.isRequired,
};

export default EntranceExamInstructions;
