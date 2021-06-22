import '@testing-library/jest-dom';
import { Factory } from 'rosie';
import React from 'react';
import { fireEvent } from '@testing-library/dom';
import Instructions from './index';
import { store, getExamAttemptsData, startTimedExam } from '../data';
import { continueExam, submitExam } from '../data/thunks';
import Emitter from '../data/emitter';
import { TIMER_REACHED_NULL } from '../timer/events';
import { render, screen, act } from '../setupTest';
import { ExamStateProvider } from '../index';
import {
  ExamStatus, ExamType, INCOMPLETE_STATUSES, VerificationStatus,
} from '../constants';

jest.mock('../data', () => ({
  store: {},
  getExamAttemptsData: jest.fn(),
  startTimedExam: jest.fn(),
}));
jest.mock('../data/thunks', () => ({
  continueExam: jest.fn(),
  getExamReviewPolicy: jest.fn(),
  submitExam: jest.fn(),
}));
continueExam.mockReturnValue(jest.fn());
submitExam.mockReturnValue(jest.fn());
getExamAttemptsData.mockReturnValue(jest.fn());
startTimedExam.mockReturnValue(jest.fn());
store.subscribe = jest.fn();
store.dispatch = jest.fn();

describe('SequenceExamWrapper', () => {
  it('Start exam instructions can be successfully rendered', () => {
    store.getState = () => ({ examState: Factory.build('examState') });

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
      examState: Factory.build('examState', {
        exam: Factory.build('exam', {
          type: ExamType.PROCTORED,
          attempt: Factory.build('attempt', {
            attempt_status: ExamStatus.STARTED,
          }),
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

  it.each([
    ['', ''],
    ['integration@email.com', ''],
    ['', 'learner_notification@example.com'],
    ['integration@email.com', 'learner_notification@example.com'],
  ])('Shows onboarding exam entrance instructions when receives onboarding exam with integration email: "%s", learner email: "%s"', (integrationEmail, learnerEmail) => {
    store.getState = () => ({
      examState: Factory.build('examState', {
        verification: {
          status: 'approved',
        },
        proctoringSettings: Factory.build('proctoringSettings', {
          learner_notification_from_email: learnerEmail,
          integration_specific_email: integrationEmail,
        }),
        exam: Factory.build('exam', {
          type: ExamType.ONBOARDING,
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

    expect(queryByTestId('exam-instructions-title')).toHaveTextContent('Proctoring onboarding exam');
    const integrationEmailComponent = queryByTestId('integration-email-contact');
    const learnerNotificationEmailComponent = queryByTestId('learner-notification-email-contact');
    if (learnerEmail) {
      expect(learnerNotificationEmailComponent).toBeInTheDocument();
      expect(learnerNotificationEmailComponent).toHaveTextContent(learnerEmail);
    } else {
      expect(learnerNotificationEmailComponent).not.toBeInTheDocument();
    }
    if (integrationEmail) {
      expect(integrationEmailComponent).toBeInTheDocument();
      expect(integrationEmailComponent).toHaveTextContent(integrationEmail);
    } else {
      expect(integrationEmailComponent).not.toBeInTheDocument();
    }
  });

  it('Shows practice exam entrance instructions when receives practice exam', () => {
    store.getState = () => ({
      examState: Factory.build('examState', {
        verification: {
          status: 'approved',
        },
        exam: Factory.build('exam', {
          type: ExamType.PRACTICE,
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
    expect(getByTestId('exam-instructions-title')).toHaveTextContent('Try a proctored exam');
  });

  it('Shows failed prerequisites page if user has failed prerequisites for the exam', () => {
    store.getState = () => ({
      examState: Factory.build('examState', {
        timeIsOver: true,
        allowProctoringOptOut: true,
        proctoringSettings: Factory.build('proctoringSettings', {
          platform_name: 'Your Platform',
        }),
        exam: Factory.build('exam', {
          is_proctored: true,
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
      examState: Factory.build('examState', {
        timeIsOver: true,
        proctoringSettings: Factory.build('proctoringSettings', {
          platform_name: 'Your Platform',
        }),
        exam: Factory.build('exam', {
          is_proctored: true,
          type: ExamType.PROCTORED,
          prerequisite_status: {
            are_prerequisites_satisfied: false,
            pending_prerequisites: [
              {
                test: 'failed',
              },
            ],
          },
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

    const skipProctoredExamButton = screen.queryByText('Take this exam without proctoring.');
    expect(getByTestId('pending-prerequisites')).toBeInTheDocument();
    expect(skipProctoredExamButton).toBeNull();
  });

  it('Instructions for error status', () => {
    store.getState = () => ({
      examState: Factory.build('examState', {
        timeIsOver: true,
        proctoringSettings: Factory.build('proctoringSettings', {
          link_urls: [
            {
              contact_us: 'http://localhost:2000',
            },
          ],
        }),
        exam: Factory.build('exam', {
          type: ExamType.PROCTORED,
          attempt: Factory.build('attempt', {
            attempt_status: ExamStatus.ERROR,
          }),
        }),
      }),
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
      examState: Factory.build('examState', {
        timeIsOver: true,
        proctoringSettings: Factory.build('proctoringSettings', {
          platform_name: 'Platform Name',
        }),
        exam: Factory.build('exam', {
          type: ExamType.PROCTORED,
          attempt: Factory.build('attempt', {
            attempt_status: ExamStatus.READY_TO_RESUME,
          }),
        }),
      }),
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

  it.each([10, 0])('Shows correct instructions when attempt status is ready_to_submit and %s seconds left', async (secondsLeft) => {
    const attempt = Factory.build('attempt', {
      time_remaining_seconds: secondsLeft,
      attempt_status: ExamStatus.READY_TO_SUBMIT,
    });
    store.getState = () => ({
      examState: Factory.build('examState', {
        activeAttempt: attempt,
        exam: Factory.build('exam', {
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

    expect(queryByTestId('exam-instructions-title')).toHaveTextContent('Are you sure that you want to submit your timed exam?');
    fireEvent.click(queryByTestId('end-exam-button'));
    expect(submitExam).toHaveBeenCalled();
    const continueButton = queryByTestId('continue-exam-button');
    if (secondsLeft > 0) {
      expect(continueButton).toBeInTheDocument();
      fireEvent.click(continueButton);
      expect(continueExam).toHaveBeenCalledTimes(1);
      act(() => {
        Emitter.emit(TIMER_REACHED_NULL);
      });
      expect(queryByTestId('continue-exam-button')).not.toBeInTheDocument();
    } else {
      expect(continueButton).not.toBeInTheDocument();
    }
  });

  it('Instructions for submitted status', () => {
    store.getState = () => ({
      examState: Factory.build('examState', {
        exam: Factory.build('exam', {
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
    expect(getByTestId('exam.submittedExamInstructions.title')).toHaveTextContent('You have submitted your timed exam.');
  });

  it('Instructions when exam time is over', () => {
    store.getState = () => ({
      examState: Factory.build('examState', {
        timeIsOver: true,
        exam: Factory.build('exam', {
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
    expect(getByTestId('exam.submittedExamInstructions.title')).toHaveTextContent('The time allotted for this exam has expired.');
  });

  it.each(['integration@example.com', ''])('Shows correct rejected onboarding exam instructions when attempt is rejected and integration email is "%s"', (integrationEmail) => {
    store.getState = () => ({
      examState: Factory.build('examState', {
        proctoringSettings: Factory.build('proctoringSettings', {
          platform_name: 'Your Platform',
          integration_specific_email: integrationEmail,
        }),
        exam: Factory.build('exam', {
          is_proctored: true,
          type: ExamType.ONBOARDING,
          attempt: Factory.build('attempt', {
            attempt_status: ExamStatus.REJECTED,
          }),
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

    expect(queryByTestId('rejected-onboarding-title')).toBeInTheDocument();
    const contactComponent = queryByTestId('integration-email-contact');
    if (integrationEmail) {
      expect(contactComponent).toBeInTheDocument();
      expect(contactComponent).toHaveTextContent(integrationEmail);
    } else {
      expect(contactComponent).not.toBeInTheDocument();
    }
  });

  it('Shows submit onboarding exam instructions if exam is onboarding and attempt status is ready_to_submit', () => {
    store.getState = () => ({
      examState: Factory.build('examState', {
        proctoringSettings: Factory.build('proctoringSettings', {
          platform_name: 'Your Platform',
        }),
        activeAttempt: {},
        exam: Factory.build('exam', {
          is_proctored: true,
          type: ExamType.ONBOARDING,
          attempt: Factory.build('attempt', {
            attempt_status: ExamStatus.READY_TO_SUBMIT,
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

    expect(getByTestId('submit-onboarding-exam')).toBeInTheDocument();
  });

  it('Shows error onboarding exam instructions if exam is onboarding and attempt status is error', () => {
    store.getState = () => ({
      examState: Factory.build('examState', {
        proctoringSettings: Factory.build('proctoringSettings', {
          platform_name: 'Your Platform',
        }),
        activeAttempt: {},
        exam: Factory.build('exam', {
          is_proctored: true,
          type: ExamType.ONBOARDING,
          attempt: Factory.build('attempt', {
            attempt_status: ExamStatus.ERROR,
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

    expect(screen.getByText('Error: There was a problem with your onboarding session')).toBeInTheDocument();
    expect(screen.getByTestId('retry-exam-button')).toHaveTextContent('Retry my exam');
  });

  it('Shows submitted onboarding exam instructions if exam is onboarding and attempt status is submitted', () => {
    store.getState = () => ({
      examState: Factory.build('examState', {
        proctoringSettings: Factory.build('proctoringSettings', {
          platform_name: 'Your Platform',
          integration_specific_email: 'test@example.com',
          learner_notification_from_email: 'test_notification@example.com',
        }),
        activeAttempt: {},
        exam: Factory.build('exam', {
          is_proctored: true,
          type: ExamType.ONBOARDING,
          attempt: Factory.build('attempt', {
            attempt_status: ExamStatus.SUBMITTED,
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

    const retryExamButton = screen.getByTestId('retry-exam-button');
    expect(retryExamButton).toHaveTextContent('Retry my exam');
    expect(screen.getByText('You have submitted this onboarding exam')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'test@example.com' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'test_notification@example.com' })).toBeInTheDocument();

    expect(retryExamButton).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'I understand and want to reset this onboarding exam.' }));
    expect(retryExamButton).not.toBeDisabled();
  });

  it('Shows verified onboarding exam instructions if exam is onboarding and attempt status is verified', () => {
    store.getState = () => ({
      examState: Factory.build('examState', {
        proctoringSettings: Factory.build('proctoringSettings', {
          platform_name: 'Your Platform',
          integration_specific_email: 'test@example.com',
        }),
        activeAttempt: {},
        exam: Factory.build('exam', {
          is_proctored: true,
          type: ExamType.ONBOARDING,
          attempt: Factory.build('attempt', {
            attempt_status: ExamStatus.VERIFIED,
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

    expect(screen.getByText('Your onboarding profile was reviewed successfully')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'test@example.com' })).toHaveTextContent('test@example.com');
  });

  it('Shows error practice exam instructions if exam is onboarding and attempt status is error', () => {
    store.getState = () => ({
      examState: Factory.build('examState', {
        proctoringSettings: Factory.build('proctoringSettings', {
          platform_name: 'Your Platform',
        }),
        activeAttempt: {},
        exam: Factory.build('exam', {
          is_proctored: true,
          type: ExamType.PRACTICE,
          attempt: Factory.build('attempt', {
            attempt_status: ExamStatus.ERROR,
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

    expect(screen.getByText('There was a problem with your practice proctoring session')).toBeInTheDocument();
    expect(screen.getByTestId('retry-exam-button')).toHaveTextContent('Retry my exam');
  });

  it('Shows submitted practice exam instructions if exam is onboarding and attempt status is submitted', () => {
    store.getState = () => ({
      examState: Factory.build('examState', {
        proctoringSettings: Factory.build('proctoringSettings', {
          platform_name: 'Your Platform',
        }),
        activeAttempt: {},
        exam: Factory.build('exam', {
          is_proctored: true,
          type: ExamType.PRACTICE,
          attempt: Factory.build('attempt', {
            attempt_status: ExamStatus.SUBMITTED,
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

    expect(screen.getByText('You have submitted this practice proctored exam')).toBeInTheDocument();
    expect(screen.getByTestId('retry-exam-button')).toHaveTextContent('Retry my exam');
  });

  it('Does not show expired page if exam is passed due date and is practice', () => {
    store.getState = () => ({
      examState: Factory.build('examState', {
        proctoringSettings: Factory.build('proctoringSettings', {
          platform_name: 'Your Platform',
        }),
        activeAttempt: {},
        exam: Factory.build('exam', {
          is_proctored: true,
          type: ExamType.PRACTICE,
          passed_due_date: true,
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

    expect(screen.getByText('Continue to my practice exam.')).toBeInTheDocument();
  });

  it.each([ExamType.TIMED, ExamType.PROCTORED, ExamType.ONBOARDING])('Shows expired page when exam is passed due date and is %s', (examType) => {
    store.getState = () => ({
      examState: Factory.build('examState', {
        proctoringSettings: Factory.build('proctoringSettings', {
          platform_name: 'Your Platform',
        }),
        activeAttempt: {},
        exam: Factory.build('exam', {
          is_proctored: true,
          type: examType,
          passed_due_date: true,
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

    expect(screen.getByText('The due date for this exam has passed')).toBeInTheDocument();
  });

  [ExamType.PROCTORED, ExamType.TIMED].forEach((examType) => {
    it.each(INCOMPLETE_STATUSES)(`Shows expired page when exam is ${examType} and has passed due date and attempt is in %s status`,
      (item) => {
        store.getState = () => ({
          examState: Factory.build('examState', {
            proctoringSettings: Factory.build('proctoringSettings', {
              platform_name: 'Your Platform',
            }),
            activeAttempt: {},
            exam: Factory.build('exam', {
              is_proctored: true,
              type: examType,
              attempt: Factory.build('attempt', {
                attempt_status: item,
              }),
              passed_due_date: true,
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

        expect(screen.getByText('The due date for this exam has passed')).toBeInTheDocument();
      });
  });

  it('Shows download software proctored exam instructions if attempt status is created and verification status is approved', () => {
    const instructions = [
      'instruction 1',
      'instruction 2',
      'instruction 3',
    ];
    store.getState = () => ({
      examState: Factory.build('examState', {
        activeAttempt: {},
        proctoringSettings: Factory.build('proctoringSettings', {
          provider_name: 'Provider Name',
          provider_tech_support_email: 'support@example.com',
          provider_tech_support_phone: '+123456789',
          exam_proctoring_backend: {
            instructions,
          },
        }),
        verification: {
          status: VerificationStatus.APPROVED,
          can_verify: true,
        },
        exam: Factory.build('exam', {
          is_proctored: true,
          type: ExamType.PROCTORED,
          attempt: Factory.build('attempt', {
            attempt_status: ExamStatus.CREATED,
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

    expect(screen.getByText(
      'If you have issues relating to proctoring, you can contact '
      + 'Provider Name technical support by emailing support@example.com or by calling +123456789.',
    )).toBeInTheDocument();
    expect(screen.getByText('Set up and start your proctored exam.')).toBeInTheDocument();
    instructions.forEach((instruction) => {
      expect(screen.getByText(instruction)).toBeInTheDocument();
    });
  });
});
