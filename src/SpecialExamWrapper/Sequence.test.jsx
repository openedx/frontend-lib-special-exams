import '@testing-library/jest-dom';
import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { AppContext } from '@edx/frontend-platform/react';
import {
  getExamData,
  getAttemptData,
  startExam,
  store,
} from './data';
import { SequenceExamWrapper } from './Sequence';

jest.mock('./data', () => ({
  store: {},
  getExamData: jest.fn(),
  getAttemptData: jest.fn(),
  startExam: jest.fn(),
}));
getExamData.mockReturnValue(jest.fn());
getAttemptData.mockReturnValue(jest.fn());
startExam.mockReturnValue(jest.fn());

store.subscribe = jest.fn();
store.dispatch = jest.fn();
store.getState = () => ({
  exam: {
    examId: null,
    isLoading: false,
    examDuration: 30,
    attempt: {},
    examStarted: false,
  },
});

test('SequenceExamWrapper renders successfully', () => {
  const sequence = {
    id: 'block-v1:test+test+test+type@sequential+block@5b1bb1aaf6d34e79b213aa37422b4743',
    isTimeLimited: true,
  };
  const authenticatedUser = {
    userId: 1,
  };
  const coursewareSliceMock = createSlice({
    name: 'courseware',
    initialState: {
      courseId: 'course-v1:test+test+test',
    },
  });
  const appLearningStoreMock = configureStore({
    reducer: {
      courseware: coursewareSliceMock.reducer,
    },
  });
  const { getByTestId } = render(
    <AppContext.Provider value={{ authenticatedUser }}>
      <Provider store={appLearningStoreMock}>
        <SequenceExamWrapper sequence={sequence}>
          <div>children</div>
        </SequenceExamWrapper>
      </Provider>
    </AppContext.Provider>,
  );
  expect(getByTestId('exam-instructions-title')).toHaveTextContent('Subsection is a Timed Exam (30 minutes)');
});
