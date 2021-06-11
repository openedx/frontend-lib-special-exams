import React from 'react';
import PropTypes from 'prop-types';
import { Container } from '@edx/paragon';
import { ExamType } from '../constants';
import { SubmitProctoredExamInstructions } from './proctored_exam';
import { SubmitTimedExamInstructions } from './timed_exam';
import Footer from './proctored_exam/Footer';

const SubmitExamInstructions = ({ examType }) => (
  <div>
    <Container className="border py-5 mb-4">
      {examType === ExamType.TIMED
        ? <SubmitTimedExamInstructions />
        : <SubmitProctoredExamInstructions />}
    </Container>
    {examType !== ExamType.TIMED && <Footer />}
  </div>
);

SubmitExamInstructions.propTypes = {
  examType: PropTypes.string.isRequired,
};

export default SubmitExamInstructions;
