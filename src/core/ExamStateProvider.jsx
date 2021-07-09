import React from 'react';
import { withExamStore } from '../hocs';
import * as dispatchActions from '../data/thunks';
import ExamStateContext from '../context';
import { IS_STARTED_STATUS } from '../constants';

/**
 * Make exam state available as a context for all library components.
 * @param children - sequence content
 * @param state - exam state params and actions
 * @returns {JSX.Element}
 */
// eslint-disable-next-line react/prop-types
const StateProvider = ({ children, ...state }) => (
  <ExamStateContext.Provider value={{
    ...state,
    showTimer: !!(state.activeAttempt && IS_STARTED_STATUS(state.activeAttempt.attempt_status)),
  }}
  >
    {children}
  </ExamStateContext.Provider>
);

const mapStateToProps = (state) => ({ ...state.examState });

const ExamStateProvider = withExamStore(
  StateProvider,
  mapStateToProps,
  dispatchActions,
);

export default ExamStateProvider;
