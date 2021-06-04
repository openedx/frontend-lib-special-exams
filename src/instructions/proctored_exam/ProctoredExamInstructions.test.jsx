import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent } from '@testing-library/dom';
import Instructions from '../index';
import { store, getExamAttemptsData, startExam } from '../../data';
import { render } from '../../setupTest';
import { ExamStateProvider } from '../../index';
import { ExamStatus, ExamType, ONBOARDING_ERRORS } from '../../constants';

jest.mock('../../data', () => ({
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
        allowProctoringOptOut: true,
        proctoringSettings: {
          platform_name: 'Your Platform',
        },
        verification: {
          status: 'none',
          can_verify: true,
        },
        exam: {
          type: ExamType.PROCTORED,
          is_proctored: true,
          time_limit_mins: 30,
          attempt: {},
        },
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
    expect(getByTestId('start-exam-button')).toHaveTextContent('Continue to my proctored exam.');
    fireEvent.click(getByTestId('start-exam-without-proctoring-button'));
    expect(getByTestId('proctored-exam-instructions-title'))
      .toHaveTextContent('Are you sure you want to take this exam without proctoring?');
    fireEvent.click(getByTestId('skip-cancel-exam-button'));
    expect(getByTestId('start-exam-without-proctoring-button'))
      .toHaveTextContent('Take this exam without proctoring.');
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
        proctoringSettings: {},
        exam: {
          type: ExamType.PROCTORED,
          is_proctored: true,
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

  it('Instructions are shown when attempt status is created', () => {
    store.getState = () => ({
      examState: {
        isLoading: false,
        proctoringSettings: {
          platform_name: 'Your Platform',
        },
        verification: {
          status: 'none',
          can_verify: true,
        },
        activeAttempt: {
          attempt_status: 'created',
        },
        exam: {
          type: ExamType.PROCTORED,
          is_proctored: true,
          time_limit_mins: 30,
          attempt: {
            attempt_status: 'created',
          },
        },
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
    expect(getByTestId('exam.VerificationProctoredExamInstructions-continue-button'))
      .toHaveTextContent('Continue to Verification');
  });

  it('Instructions are shown when attempt status is ready_to_start', () => {
    store.getState = () => ({
      examState: {
        isLoading: false,
        proctoringSettings: {
          platform_name: 'Your Platform',
        },
        verification: {
          status: 'none',
          can_verify: true,
        },
        activeAttempt: {
          attempt_status: 'ready_to_start',
        },
        exam: {
          type: ExamType.PROCTORED,
          is_proctored: true,
          time_limit_mins: 30,
          attempt: {
            attempt_status: 'ready_to_start',
          },
        },
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
    expect(getByTestId('proctored-exam-instructions-rulesLink'))
      .toHaveTextContent('Rules for Online Proctored Exams');
  });

  it('Instructions are shown when attempt status is submitted', () => {
    store.getState = () => ({
      examState: {
        isLoading: false,
        proctoringSettings: {
          platform_name: 'Your Platform',
        },
        verification: {
          status: 'none',
          can_verify: true,
        },
        activeAttempt: {
          attempt_status: 'submitted',
        },
        exam: {
          type: ExamType.PROCTORED,
          is_proctored: true,
          time_limit_mins: 30,
          attempt: {
            attempt_status: 'submitted',
          },
        },
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
    expect(getByTestId('proctored-exam-instructions-title')).toHaveTextContent('You have submitted this proctored exam for review');
  });

  it('Instructions are shown when attempt status is ready_to_submit', () => {
    store.getState = () => ({
      examState: {
        isLoading: false,
        verification: {
          status: 'none',
          can_verify: true,
        },
        activeAttempt: {
          attempt_status: 'ready_to_submit',
        },
        proctoringSettings: {},
        exam: {
          type: ExamType.PROCTORED,
          is_proctored: true,
          time_limit_mins: 30,
          attempt: {
            attempt_status: 'ready_to_submit',
          },
        },
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
    expect(getByTestId('proctored-exam-instructions-title')).toHaveTextContent('Are you sure you want to end your proctored exam?');
  });

  it('Instructions are shown when attempt status is verified', () => {
    store.getState = () => ({
      examState: {
        isLoading: false,
        proctoringSettings: {
          platform_name: 'Your Platform',
        },
        verification: {
          status: 'none',
          can_verify: true,
        },
        activeAttempt: {
          attempt_status: 'verified',
        },
        exam: {
          type: ExamType.PROCTORED,
          is_proctored: true,
          time_limit_mins: 30,
          attempt: {
            attempt_status: 'verified',
          },
        },
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
    expect(getByTestId('proctored-exam-instructions-title')).toHaveTextContent('Your proctoring session was reviewed successfully.');
  });

  it('Instructions are shown when attempt status is rejected', () => {
    store.getState = () => ({
      examState: {
        isLoading: false,
        verification: {
          status: 'none',
          can_verify: true,
        },
        activeAttempt: {
          attempt_status: 'rejected',
        },
        proctoringSettings: {},
        exam: {
          type: ExamType.PROCTORED,
          is_proctored: true,
          time_limit_mins: 30,
          attempt: {
            attempt_status: 'rejected',
          },
        },
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
    expect(getByTestId('proctored-exam-instructions-title'))
      .toHaveTextContent('Your proctoring session was reviewed, but did not pass all requirements');
  });

  it.each(ONBOARDING_ERRORS)('Renders correct onboarding error instructions when status is %s ', (status) => {
    store.getState = () => ({
      examState: {
        isLoading: false,
        verification: {
          status: 'none',
          can_verify: true,
        },
        activeAttempt: {
          attempt_status: 'rejected',
        },
        proctoringSettings: {},
        exam: {
          type: ExamType.PROCTORED,
          is_proctored: true,
          time_limit_mins: 30,
          attempt: {
            attempt_status: status,
          },
        },
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

    const testId = status === ExamStatus.ONBOARDING_EXPIRED ? ExamStatus.ONBOARDING_MISSING : status;

    expect(getByTestId(testId)).toBeInTheDocument();
  });
});
