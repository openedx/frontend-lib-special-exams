import '@testing-library/jest-dom';
import React from 'react';
import Instructions from './index';
import { store, getExamAttemptsData, startExam } from '../data';
import { render } from '../setupTest';
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

describe('SequenceExamWrapper', () => {
  it('Start exam instructions can be successfully rendered', () => {
    store.getState = () => ({
      examState: {
        isLoading: false,
        activeAttempt: null,
        verification: {
          status: 'none',
          can_verify: true,
        },
        exam: {
          time_limit_mins: 30,
          attempt: {},
        },
      },
    });

    const { getByTestId } = render(
      <ExamStateProvider>
        <Instructions>
          <div data-testid="sequence-content">Sequence</div>
        </Instructions>
      </ExamStateProvider>,
      { store },
    );
    expect(getByTestId('start-exam-button')).toHaveTextContent('I am ready to start this timed exam.');
  });

  it('Instructions are not shown when exam is started', () => {
    store.getState = () => ({
      examState: {
        isLoading: false,
        verification: {
          status: 'none',
          can_verify: true,
        },
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
      <ExamStateProvider>
        <Instructions>
          <div data-testid="sequence-content">Sequence</div>
        </Instructions>
      </ExamStateProvider>,
      { store },
    );
    expect(getByTestId('sequence-content')).toHaveTextContent('Sequence');
  });

  it('Shows failed prerequisites page if user has failed prerequisites for the exam', () => {
    store.getState = () => ({
      examState: {
        isLoading: false,
        timeIsOver: true,
        proctoringSettings: {
          platform_name: 'Your Platform',
        },
        activeAttempt: {},
        exam: {
          is_proctored: true,
          time_limit_mins: 30,
          attempt: {},
          prerequisite_status: {
            failed_prerequisites: [
              {
                test: 'failed',
              },
            ],
          },
        },
        verification: {},
      },
    });

    const { getByTestId } = render(
      <ExamStateProvider>
        <Instructions>
          <div>Sequence</div>
        </Instructions>
      </ExamStateProvider>,
      { store },
    );

    expect(getByTestId('failed-prerequisites')).toBeInTheDocument();
  });

  it('Shows pending prerequisites page if user has failed prerequisites for the exam', () => {
    store.getState = () => ({
      examState: {
        isLoading: false,
        timeIsOver: true,
        proctoringSettings: {
          platform_name: 'Your Platform',
        },
        activeAttempt: {},
        exam: {
          is_proctored: true,
          time_limit_mins: 30,
          attempt: {},
          prerequisite_status: {
            pending_prerequisites: [
              {
                test: 'failed',
              },
            ],
          },
        },
        verification: {},
      },
    });

    const { getByTestId } = render(
      <ExamStateProvider>
        <Instructions>
          <div>Sequence</div>
        </Instructions>
      </ExamStateProvider>,
      { store },
    );

    expect(getByTestId('pending-prerequisites')).toBeInTheDocument();
  });
});
