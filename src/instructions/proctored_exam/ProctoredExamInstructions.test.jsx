import '@testing-library/jest-dom';
import { Factory } from 'rosie';
import React from 'react';
import { fireEvent, waitFor } from '@testing-library/dom';
import Instructions from '../index';
import {
  initializeMockApp,
  initializeTestStore,
  render,
  screen,
} from '../../setupTest';
import {
  ExamType,
  ExamStatus,
  ONBOARDING_ERRORS,
} from '../../constants';

const mockSubmitExam = jest.fn();
jest.mock('../../data', () => ({
  ...jest.requireActual('../../data'),
  useContinueExam: () => ({ mutate: jest.fn() }),
  useCreateProctoredExamAttempt: () => ({ mutate: jest.fn() }),
  useResetExam: () => ({ mutate: jest.fn() }),
  useSkipProctoringExam: () => ({ mutate: jest.fn() }),
  useStartProctoredExam: () => ({ mutate: jest.fn() }),
  useStartTimedExam: () => ({ mutate: jest.fn() }),
  useSubmitExam: () => ({ mutate: mockSubmitExam }),
}));
jest.mock('../../data/api', () => ({
  ...jest.requireActual('../../data/api'),
  fetchExamReviewPolicy: jest.fn(() => Promise.resolve({ review_policy: '' })),
}));

describe('SequenceExamWrapper', () => {
  let store;

  beforeEach(() => {
    initializeMockApp();
    jest.clearAllMocks();
    store = initializeTestStore();
    store.subscribe = jest.fn();
    store.dispatch = jest.fn();
  });

  it('Start exam instructions can be successfully rendered', () => {
    const specialExams = Factory.build('specialExams', {
      allowProctoringOptOut: true,
      exam: Factory.build('exam', {
        type: ExamType.PROCTORED,
        is_proctored: true,
      }),
    });

    const { getByTestId } = render(
      <Instructions>
        <div>Sequence</div>
      </Instructions>,
      { specialExams },
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
    const specialExams = Factory.build('specialExams', {
      activeAttempt: attempt,
      exam: Factory.build('exam', {
        type: ExamType.PROCTORED,
        is_proctored: true,
        attempt,
      }),
    });

    const { getByTestId } = render(
      <Instructions>
        <div data-testid="sequence-content">Sequence</div>
      </Instructions>,
      { specialExams },
    );
    expect(getByTestId('sequence-content')).toHaveTextContent('Sequence');
  });

  it('Shows correct instructions when attempt status is ready_to_start', () => {
    const specialExams = Factory.build('specialExams', {
      exam: Factory.build('exam', {
        type: ExamType.PROCTORED,
        is_proctored: true,
        reviewPolicy: 'review policy',
        attempt: Factory.build('attempt', {
          attempt_status: ExamStatus.READY_TO_START,
        }),
      }),
    });

    render(
      <Instructions>
        <div>Sequence</div>
      </Instructions>,
      { specialExams },
    );
    expect(screen.getByTestId('proctored-exam-instructions-rulesLink')).toHaveTextContent('Rules for Online Proctored Exams');
    expect(screen.getByTestId('duration-text')).toHaveTextContent('You have 30 minutes to complete this exam.');
    expect(screen.getByText('review policy')).toBeInTheDocument();
  });

  it('Shows correct instructions when attempt status is ready_to_start and attempt has no total time', () => {
    const specialExams = Factory.build('specialExams', {
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
    });

    render(
      <Instructions>
        <div>Sequence</div>
      </Instructions>,
      { specialExams },
    );
    expect(screen.getByTestId('proctored-exam-instructions-rulesLink')).toHaveTextContent('Rules for Online Proctored Exams');
    expect(screen.getByTestId('duration-text')).toHaveTextContent('You have 30 minutes to complete this exam.');
    expect(screen.getByText('review policy')).toBeInTheDocument();
  });

  it('Instructions are shown when attempt status is submitted', () => {
    const specialExams = Factory.build('specialExams', {
      exam: Factory.build('exam', {
        type: ExamType.PROCTORED,
        is_proctored: true,
        attempt: Factory.build('attempt', {
          attempt_status: ExamStatus.SUBMITTED,
        }),
      }),
    });

    const { getByTestId } = render(
      <Instructions>
        <div>Sequence</div>
      </Instructions>,
      { specialExams },
    );
    expect(getByTestId('proctored-exam-instructions-title')).toHaveTextContent('You have submitted this proctored exam for review');
  });

  it('Shows correct instructions when attempt status is ready_to_submit ', () => {
    const attempt = Factory.build('attempt', {
      attempt_status: ExamStatus.READY_TO_SUBMIT,
      use_legacy_attempt_api: true,
    });
    const specialExams = Factory.build('specialExams', {
      activeAttempt: attempt,
      exam: Factory.build('exam', {
        type: ExamType.PROCTORED,
        is_proctored: true,
        attempt,
      }),
    });

    const { queryByTestId } = render(
      <Instructions>
        <div>Sequence</div>
      </Instructions>,
      { specialExams },
    );

    expect(queryByTestId('proctored-exam-instructions-title')).toHaveTextContent('Are you sure you want to end your proctored exam?');
    fireEvent.click(queryByTestId('end-exam-button'));
    expect(mockSubmitExam).toHaveBeenCalled();
  });

  it('Initiates an LTI launch in a new window when the user clicks the submit button', async () => {
    const { location } = window;
    delete window.location;
    const mockAssign = jest.fn();
    window.location = {
      assign: mockAssign,
    };
    const attempt = Factory.build('attempt', {
      attempt_status: ExamStatus.READY_TO_SUBMIT,
      use_legacy_attempt_api: false,
      attempt_id: 1,
    });
    const specialExams = Factory.build('specialExams', {
      activeAttempt: attempt,
      exam: Factory.build('exam', {
        is_proctored: true,
        type: ExamType.PROCTORED,
        attempt,
      }),
    });

    const { queryByTestId } = render(
      <Instructions>
        <div>Sequence</div>
      </Instructions>,
      { specialExams },
    );

    expect(queryByTestId('proctored-exam-instructions-title')).toHaveTextContent('Are you sure you want to end your proctored exam?');
    fireEvent.click(queryByTestId('end-exam-button'));
    await waitFor(() => { expect(mockAssign).toHaveBeenCalledWith('http://localhost:18740/lti/end_assessment/1'); });

    // restore window.location
    window.location = location;
  });

  it('Instructions are shown when attempt status is verified', () => {
    const specialExams = Factory.build('specialExams', {
      exam: Factory.build('exam', {
        type: ExamType.PROCTORED,
        is_proctored: true,
        attempt: Factory.build('attempt', {
          attempt_status: ExamStatus.VERIFIED,
        }),
      }),
    });

    const { getByTestId } = render(
      <Instructions>
        <div>Sequence</div>
      </Instructions>,
      { specialExams },
    );
    expect(getByTestId('proctored-exam-instructions-title')).toHaveTextContent('Your proctoring session was reviewed successfully.');
  });

  it('Instructions are shown when attempt status is rejected', () => {
    const specialExams = Factory.build('specialExams', {
      exam: Factory.build('exam', {
        type: ExamType.PROCTORED,
        is_proctored: true,
        attempt: Factory.build('attempt', {
          attempt_status: ExamStatus.REJECTED,
        }),
      }),
    });

    const { getByTestId } = render(
      <Instructions>
        <div>Sequence</div>
      </Instructions>,
      { specialExams },
    );
    expect(getByTestId('proctored-exam-instructions-title'))
      .toHaveTextContent('Your proctoring session was reviewed, but did not pass all requirements');
  });

  it.each(ONBOARDING_ERRORS)('Renders correct onboarding error instructions when status is %s ', (status) => {
    const specialExams = Factory.build('specialExams', {
      exam: Factory.build('exam', {
        type: ExamType.PROCTORED,
        is_proctored: true,
        attempt: Factory.build('attempt', {
          attempt_status: status,
        }),
      }),
    });

    const { getByTestId } = render(
      <Instructions>
        <div>Sequence</div>
      </Instructions>,
      { specialExams },
    );

    const testId = status === ExamStatus.ONBOARDING_EXPIRED ? ExamStatus.ONBOARDING_MISSING : status;

    expect(getByTestId(testId)).toBeInTheDocument();
  });
});
