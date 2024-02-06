import React, { useMemo } from 'react';
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
const StateProvider = ({ children, ...state }) => {
  // This is bizzare and unecessary maybe, or maybe it wasn't documented as to why
  // They took stuff out of redux and put it in a context, but they could have just used the redux store???
  // This was meant to only make "showTimer" change when the state would change.
  // useMemo is used when computations are expensive
  // But this isn't so why use it here?
  // Idk why this is optimal
  const contextValue = useMemo(() => ({
    ...state,
    showTimer: !!(state.activeAttempt && IS_STARTED_STATUS(state.activeAttempt.attempt_status)),
  }), [state]);
  return (
    <ExamStateContext.Provider value={contextValue}>
      {children}
    </ExamStateContext.Provider>
  );
};

const mapStateToProps = (state) => ({ ...state.examState });

const ExamStateProvider = withExamStore(
  StateProvider,
  mapStateToProps,
  dispatchActions,
);

export default ExamStateProvider;
