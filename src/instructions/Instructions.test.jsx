import '@testing-library/jest-dom';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import Instructions from './index';
import { store, getExamAttemptsData, startExam } from '../data';
import { ExamStateProvider } from '../index';

jest.mock('../data', () => ({
  store: {},
  getExamAttemptsData: jest.fn(),
  startExam: jest.fn(),
}));
getExamAttemptsData.mockReturnValue(jest.fn());
startExam.mockReturnValue(jest.fn());
store.subscribe = jest.fn();
store.dispatch = jest.fn();

test('Start exam instructions can be successfully rendered', () => {
  store.getState = () => ({
    examState: {
      isLoading: false,
      activeAttempt: null,
      exam: {
        time_limit_mins: 30,
        attempt: {},
      },
    },
  });

  const { getByTestId } = render(
    <IntlProvider locale="en">
      <Provider store={store}>
        <ExamStateProvider>
          <Instructions><div>Sequence</div></Instructions>
        </ExamStateProvider>
      </Provider>
    </IntlProvider>,
  );
  expect(getByTestId('start-exam-button')).toHaveTextContent('I am ready to start this timed exam.');
});

test('Instructions are not shown when exam is started', () => {
  store.getState = () => ({
    examState: {
      isLoading: false,
      activeAttempt: {
        attempt_status: 'started',
      },
      exam: {
        time_limit_mins: 30,
        attempt: {
          attempt_status: 'started',
        },
      },
    },
  });

  const { getByTestId } = render(
    <IntlProvider locale="en">
      <Provider store={store}>
        <ExamStateProvider>
          <Instructions>
            <div data-testid="sequence-content">Sequence</div>
          </Instructions>
        </ExamStateProvider>
      </Provider>
    </IntlProvider>,
  );
  expect(getByTestId('sequence-content')).toHaveTextContent('Sequence');
});
