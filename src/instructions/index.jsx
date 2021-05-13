import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import StartExamInstructions from './StartExamInstructions';
import SubmitExamInstructions from './SubmitExamInstructions';
import SubmittedExamInstructions from './SubmittedExamInstructions';
import { isEmpty } from '../helpers';
import { ExamStatus } from '../constants';
import ExamStateContext from '../context';

const Instructions = ({ children }) => {
  const state = useContext(ExamStateContext);
  const { attempt } = state.exam;

  switch (true) {
    case isEmpty(attempt):
      return <StartExamInstructions />;
    case attempt.attempt_status === ExamStatus.READY_TO_SUBMIT:
      return <SubmitExamInstructions />;
    case attempt.attempt_status === ExamStatus.SUBMITTED:
      return <SubmittedExamInstructions />;
    default:
      return children;
  }
};

Instructions.propTypes = {
  children: PropTypes.element.isRequired,
};

export default Instructions;
