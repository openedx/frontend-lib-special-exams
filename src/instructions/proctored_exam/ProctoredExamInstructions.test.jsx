import '@testing-library/jest-dom';
import { Factory } from 'rosie';
import React from 'react';
import { fireEvent, waitFor } from '@testing-library/dom';
import Instructions from '../index';
import { store, getExamAttemptsData } from '../../data';
import { submitExam } from '../../data/thunks';
import { initializeMockApp, render, screen } from '../../setupTest';
import ExamStateProvider from '../../core/ExamStateProvider';
import {
  ExamType,
  ExamStatus,
  ONBOARDING_ERRORS,
} from '../../constants';

jest.mock('../../data', () => ({
  store: {},
  getExamAttemptsData: jest.fn(),
}));
jest.mock('../../data/thunks', () => ({
  getExamReviewPolicy: jest.fn(),
  submitExam: jest.fn(),
}));
submitExam.mockReturnValue(jest.fn());
getExamAttemptsData.mockReturnValue(jest.fn());
store.subscribe = jest.fn();
store.dispatch = jest.fn();

describe('SequenceExamWrapper', () => {
  beforeEach(() => {
    initializeMockApp();
    jest.clearAllMocks();
  });

  it('Start exam instructions can be successfully rendered', () => {
    store.getState = () => ({
      examState: Factory.build('examState', {
        allowProctoringOptOut: true,
        exam: Factory.build('exam', {
          type: ExamType.PROCTORED,
          is_proctored: true,
        }),
      }),
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
    const attempt = Factory.build('attempt', {
      attempt_status: ExamStatus.STARTED,
    });
    store.getState = () => ({
      examState: Factory.build('examState', {
        activeAttempt: attempt,
        exam: Factory.build('exam', {
          type: ExamType.PROCTORED,
          is_proctored: true,
          attempt,
        }),
      }),
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

  it('Shows correct instructions when attempt status is ready_to_start', () => {
    store.getState = () => ({
      examState: Factory.build('examState', {
        exam: Factory.build('exam', {
          type: ExamType.PROCTORED,
          is_proctored: true,
          reviewPolicy: 'review policy',
          attempt: Factory.build('attempt', {
            attempt_status: ExamStatus.READY_TO_START,
          }),
        }),
      }),
    });

    render(
      <ExamStateProvider>
        <Instructions>
          <div>Sequence</div>
        </Instructions>
      </ExamStateProvider>,
      { store },
    );
    expect(screen.getByTestId('proctored-exam-instructions-rulesLink')).toHaveTextContent('Rules for Online Proctored Exams');
    expect(screen.getByTestId('duration-text')).toHaveTextContent('You have 30 minutes to complete this exam.');
    expect(screen.getByText('review policy')).toBeInTheDocument();
  });

  it('Shows correct instructions when attempt status is ready_to_start and attempt has no total time', () => {
    store.getState = () => ({
      examState: Factory.build('examState', {
        exam: Factory.build('exam', {
          type: ExamType.PROCTORED,
          is_proctored: true,
          reviewPolicy: 'review policy',
          total_time: '30 minutes',
          attempt: Factory.build('attempt', {
            attempt_status: ExamStatus.READY_TO_START,
            total_time: undefined,
          }),
        }),
      }),
    });

    render(
      <ExamStateProvider>
        <Instructions>
          <div>Sequence</div>
        </Instructions>
      </ExamStateProvider>,
      { store },
    );
    expect(screen.getByTestId('proctored-exam-instructions-rulesLink')).toHaveTextContent('Rules for Online Proctored Exams');
    expect(screen.getByTestId('duration-text')).toHaveTextContent('You have 30 minutes to complete this exam.');
    expect(screen.getByText('review policy')).toBeInTheDocument();
  });

  it('Instructions are shown when attempt status is submitted', () => {
    store.getState = () => ({
      examState: Factory.build('examState', {
        exam: Factory.build('exam', {
          type: ExamType.PROCTORED,
          is_proctored: true,
          attempt: Factory.build('attempt', {
            attempt_status: ExamStatus.SUBMITTED,
          }),
        }),
      }),
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

  it('Shows correct instructions when attempt status is ready_to_submit ', () => {
    const attempt = Factory.build('attempt', {
      attempt_status: ExamStatus.READY_TO_SUBMIT,
      use_legacy_attempt_api: true,
    });
    store.getState = () => ({
      examState: Factory.build('examState', {
        activeAttempt: attempt,
        exam: Factory.build('exam', {
          type: ExamType.PROCTORED,
          is_proctored: true,
          attempt,
        }),
      }),
    });

    const { queryByTestId } = render(
      <ExamStateProvider>
        <Instructions>
          <div>Sequence</div>
        </Instructions>
      </ExamStateProvider>,
      { store },
    );

    expect(queryByTestId('proctored-exam-instructions-title')).toHaveTextContent('Are you sure you want to end your proctored exam?');
    fireEvent.click(queryByTestId('end-exam-button'));
    expect(submitExam).toHaveBeenCalled();
  });

  it('Initiates an LTI launch in a new window when the user clicks the submit button', async () => {
    const windowSpy = jest.spyOn(window, 'open');
    windowSpy.mockImplementation(() => ({}));
    const attempt = Factory.build('attempt', {
      attempt_status: ExamStatus.READY_TO_SUBMIT,
      use_legacy_attempt_api: false,
      attempt_id: 1,
    });
    store.getState = () => ({
      examState: Factory.build('examState', {
        activeAttempt: attempt,
        exam: Factory.build('exam', {
          is_proctored: true,
          type: ExamType.PROCTORED,
          attempt,
        }),
      }),
    });

    const { queryByTestId } = render(
      <ExamStateProvider>
        <Instructions>
          <div>Sequence</div>
        </Instructions>
      </ExamStateProvider>,
      { store },
    );

    expect(queryByTestId('proctored-exam-instructions-title')).toHaveTextContent('Are you sure you want to end your proctored exam?');
    fireEvent.click(queryByTestId('end-exam-button'));
    await waitFor(() => { expect(windowSpy).toHaveBeenCalledWith('http://localhost:18740/lti/end_assessment/1', '_blank'); });
  });

  it('Instructions are shown when attempt status is verified', () => {
    store.getState = () => ({
      examState: Factory.build('examState', {
        exam: Factory.build('exam', {
          type: ExamType.PROCTORED,
          is_proctored: true,
          attempt: Factory.build('attempt', {
            attempt_status: ExamStatus.VERIFIED,
          }),
        }),
      }),
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
      examState: Factory.build('examState', {
        exam: Factory.build('exam', {
          type: ExamType.PROCTORED,
          is_proctored: true,
          attempt: Factory.build('attempt', {
            attempt_status: ExamStatus.REJECTED,
          }),
        }),
      }),
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
      examState: Factory.build('examState', {
        exam: Factory.build('exam', {
          type: ExamType.PROCTORED,
          is_proctored: true,
          attempt: Factory.build('attempt', {
            attempt_status: status,
          }),
        }),
      }),
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
