import React from 'react';
import ExamWrapper from './exam/ExamWrapper';
import { withExamStore } from './hocs';
import * as dispatchActions from './data/thunks';
import ExamStateContext from './context';
import { IS_STARTED_STATUS } from './constants';

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

export const ExamStateProvider = withExamStore(
  StateProvider,
  mapStateToProps,
  dispatchActions,
);

/**
 * SequenceExamWrapper is the component responsible for handling special exams.
 * It takes control over rendering exam instructions unless exam is started only if
 * current sequence item is timed exam. Otherwise, renders any children elements passed.
 * @param children - Current course sequence item content (e.g. unit, navigation buttons etc.)
 * @returns {JSX.Element}
 * @example
 * <SequenceExamWrapper sequence={sequence} courseId={courseId}>
 *   {sequenceContent}
 * </SequenceExamWrapper>
 */
const SequenceExamWrapper = (props) => (
  <ExamStateProvider>
    <ExamWrapper {...props} />
  </ExamStateProvider>
);

export default SequenceExamWrapper;
