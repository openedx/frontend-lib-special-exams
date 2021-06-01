import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent } from '@testing-library/dom';
import Instructions from './index';
import { store, getExamAttemptsData, startExam } from '../data';
import { render, screen } from '../setupTest';
import { ExamStateProvider } from '../index';
import { ExamStatus, ExamType } from '../constants';

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
        proctoringSettings: {},
        verification: {
          status: 'none',
          can_verify: true,
        },
        exam: {
          time_limit_mins: 30,
          attempt: {},
          type: ExamType.TIMED,
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
          type: ExamType.PROCTORED,
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

  it('Shows onboarding exam entrance instructions when receives onboarding exam', () => {
    store.getState = () => ({
      examState: {
        isLoading: false,
        verification: {
          status: 'approved',
        },
        proctoringSettings: {},
        activeAttempt: {},
        exam: {
          time_limit_mins: 30,
          type: ExamType.ONBOARDING,
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
    expect(getByTestId('exam-instructions-title')).toHaveTextContent('Proctoring onboarding exam');
  });

  it('Shows practice exam entrance instructions when receives practice exam', () => {
    store.getState = () => ({
      examState: {
        isLoading: false,
        verification: {
          status: 'approved',
        },
        activeAttempt: {},
        proctoringSettings: {},
        exam: {
          time_limit_mins: 30,
          type: ExamType.PRACTICE,
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
    expect(getByTestId('exam-instructions-title')).toHaveTextContent('Try a proctored exam');
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
          allow_proctoring_opt_out: true,
          is_proctored: true,
          time_limit_mins: 30,
          attempt: {},
          type: ExamType.PROCTORED,
          prerequisite_status: {
            are_prerequisites_satisfied: false,
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
    fireEvent.click(getByTestId('start-exam-without-proctoring-button'));
    expect(getByTestId('proctored-exam-instructions-title'))
      .toHaveTextContent('Are you sure you want to take this exam without proctoring?');
    fireEvent.click(getByTestId('skip-cancel-exam-button'));
    expect(getByTestId('start-exam-without-proctoring-button'))
      .toHaveTextContent('Take this exam without proctoring.');
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
          allow_proctoring_opt_out: false,
          is_proctored: true,
          type: ExamType.PROCTORED,
          time_limit_mins: 30,
          attempt: {},
          prerequisite_status: {
            are_prerequisites_satisfied: false,
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

    const skipProctoredExamButton = screen.queryByText('Take this exam without proctoring.');
    expect(getByTestId('pending-prerequisites')).toBeInTheDocument();
    expect(skipProctoredExamButton).toBeNull();
  });

  it('Instructions for error status', () => {
    store.getState = () => ({
      examState: {
        isLoading: false,
        proctoringSettings: {
          link_urls: [
            {
              contact_us: 'http://localhost:2000',
            },
          ],
        },
        verification: {
          status: 'none',
          can_verify: true,
        },
        activeAttempt: {
          attempt_status: 'error',
        },
        exam: {
          time_limit_mins: 30,
          attempt: {
            attempt_status: 'error',
          },
        },
      },
    });

    render(
      <ExamStateProvider>
        <Instructions>
          <div data-testid="sequence-content">Sequence</div>
        </Instructions>
      </ExamStateProvider>,
      { store },
    );
    expect(screen.getByText('Error with proctored exam')).toBeInTheDocument();
  });

  it('Instructions for ready to resume status', () => {
    store.getState = () => ({
      examState: {
        isLoading: false,
        proctoringSettings: {
          link_urls: '',
          platform_name: 'Platform Name',
        },
        verification: {
          status: 'none',
          can_verify: true,
        },
        activeAttempt: {
          attempt_status: 'ready_to_resume',
        },
        exam: {
          type: 'proctored',
          time_limit_mins: 30,
          attempt: {
            attempt_status: 'ready_to_resume',
          },
        },
      },
    });

    render(
      <ExamStateProvider>
        <Instructions>
          <div data-testid="sequence-content">Sequence</div>
        </Instructions>
      </ExamStateProvider>,
      { store },
    );
    expect(screen.getByText('Your exam is ready to be resumed.')).toBeInTheDocument();
    expect(screen.getByTestId('start-exam-button')).toHaveTextContent('Continue to my proctored exam.');
  });

  it('Instructions for ready to submit status', () => {
    store.getState = () => ({
      examState: {
        isLoading: false,
        timeIsOver: false,
        verification: {
          status: 'none',
          can_verify: true,
        },
        proctoringSettings: {},
        activeAttempt: {
          attempt_status: 'ready_to_submit',
        },
        exam: {
          type: 'timed',
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
    expect(getByTestId('exam-instructions-title')).toHaveTextContent('Are you sure that you want to submit your timed exam?');
  });

  it('Instructions for submitted status', () => {
    store.getState = () => ({
      examState: {
        isLoading: false,
        timeIsOver: false,
        verification: {
          status: 'none',
          can_verify: true,
        },
        proctoringSettings: {},
        activeAttempt: {
          attempt_status: 'submitted',
        },
        exam: {
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
    expect(getByTestId('exam.submittedExamInstructions.title')).toHaveTextContent('You have submitted your timed exam.');
  });

  it('Instructions when exam time is over', () => {
    store.getState = () => ({
      examState: {
        isLoading: false,
        timeIsOver: true,
        verification: {
          status: 'none',
          can_verify: true,
        },
        proctoringSettings: {},
        activeAttempt: {
          attempt_status: 'submitted',
        },
        exam: {
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
    expect(getByTestId('exam.submittedExamInstructions.title')).toHaveTextContent('The time allotted for this exam has expired.');
  });

  it('Shows rejected onboarding exam instructions if exam is onboarding and attempt status is rejected', () => {
    store.getState = () => ({
      examState: {
        isLoading: false,
        timeIsOver: false,
        proctoringSettings: {
          platform_name: 'Your Platform',
        },
        activeAttempt: {},
        exam: {
          is_proctored: true,
          type: ExamType.ONBOARDING,
          time_limit_mins: 30,
          attempt: {
            attempt_status: ExamStatus.REJECTED,
          },
          prerequisite_status: {},
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

    expect(getByTestId('rejected-onboarding-title')).toBeInTheDocument();
  });

  it('Shows submit onboarding exam instructions if exam is onboarding and attempt status is ready_to_submit', () => {
    store.getState = () => ({
      examState: {
        isLoading: false,
        timeIsOver: false,
        proctoringSettings: {
          platform_name: 'Your Platform',
        },
        activeAttempt: {},
        exam: {
          is_proctored: true,
          type: ExamType.ONBOARDING,
          time_limit_mins: 30,
          attempt: {
            attempt_status: ExamStatus.READY_TO_SUBMIT,
          },
          prerequisite_status: {},
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

    expect(getByTestId('submit-onboarding-exam')).toBeInTheDocument();
  });
});
