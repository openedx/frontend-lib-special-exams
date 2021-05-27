import React from 'react';
import PropTypes from 'prop-types';
import { Container } from '@edx/paragon';
import { ExamType } from '../constants';
import { EntranceProctoredExamInstructions } from './proctored_exam';
import EntranceOnboardingExamInstructions from './onboarding_exam';
import EntrancePracticeExamInstructions from './practice_exam';
import StartTimedExamInstructions from './StartTimedExamInstructions';
import Footer from './proctored_exam/Footer';

const EntranceExamInstructions = ({ examType, skipProctoredExam }) => {
  let instructions;

  switch (examType) {
    case ExamType.PROCTORED:
      instructions = <EntranceProctoredExamInstructions skipProctoredExam={skipProctoredExam} />;
      break;
    case ExamType.ONBOARDING:
      instructions = <EntranceOnboardingExamInstructions />;
      break;
    case ExamType.PRACTICE:
      instructions = <EntrancePracticeExamInstructions />;
      break;
    case ExamType.TIMED:
      instructions = <StartTimedExamInstructions />;
      break;
    default:
      instructions = null;
  }

  return (
    <div>
      <Container className="border py-5 mb-4">
        {instructions}
      </Container>
      {examType !== ExamType.TIMED && <Footer />}
    </div>
  );
};

EntranceExamInstructions.propTypes = {
  examType: PropTypes.string.isRequired,
  skipProctoredExam: PropTypes.func.isRequired,
};

export default EntranceExamInstructions;
