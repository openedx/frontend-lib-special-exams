import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { logError } from '@edx/frontend-platform/logging';

import {
  continueAttempt, createExamAttempt, declineAttempt, endExamWithFailure, resetAttempt, stopAttempt, submitAttempt,
} from './api';
import {
  specialExamsQueryKeys, useActiveAttempt, useExam, useExamStateKey,
} from './queries';
import { expireExamAttempt, setApiError } from './slice';
import { workerPromiseForEventNames } from './messages/handlers';
import actionToMessageTypesMap from './messages/constants';
import { notifyStartExam } from './messages/proctorio';
import { useSequenceExam } from '../core/SequenceExamContext';

const EXAM_START_TIMEOUT_MILLISECONDS = 5000;

export const specialExamsMutationKey = ['specialExams'];

interface AttemptResponse {
  exam_attempt_id?: number;
}

interface ApiError {
  message?: string;
  detail?: string;
}

const useApiError = () => {
  const dispatch = useDispatch();
  return (error: ApiError) => dispatch(setApiError({ errorMsg: error.message || error.detail }));
};

const useFailAction = () => {
  const dispatch = useDispatch();
  return (logMessage: string, errorMsg?: string) => {
    logError(logMessage);
    if (errorMsg) {
      dispatch(setApiError({ errorMsg }));
    }
    return undefined;
  };
};

interface AttemptActionOptions<Variables> {
  run: (variables: Variables) => Promise<AttemptResponse | undefined>;
  refetchKey?: () => QueryKey;
  after?: () => void;
}

const useAttemptAction = <Variables = void>(
  action: string,
  { run, refetchKey, after }: AttemptActionOptions<Variables>,
) => {
  const queryClient = useQueryClient();
  const examStateKey = useExamStateKey();
  const apiError = useApiError();
  return useMutation({
    mutationKey: [...specialExamsMutationKey, 'attempt', action],
    mutationFn: run,
    onError: apiError,
    onSettled: async (response, error) => {
      if (!error && response === undefined) {
        return;
      }
      if (error || response?.exam_attempt_id) {
        await queryClient.invalidateQueries({ queryKey: refetchKey ? refetchKey() : examStateKey });
      }
      after?.();
    },
  });
};

// Tell the proctoring desktop app, when there is one, that the attempt was submitted.
const useNotifyWorkerOfSubmit = () => {
  const activeAttempt = useActiveAttempt();
  const apiError = useApiError();
  return () => {
    const workerUrl = activeAttempt?.desktop_application_js_url;
    if (window.Worker && activeAttempt && workerUrl) {
      workerPromiseForEventNames(actionToMessageTypesMap.submit, workerUrl)(0, activeAttempt.external_id)
        .catch(() => apiError({
          message: 'Something has gone wrong submitting your exam. Please double-check that the application is running.',
        }));
    }
  };
};

export const useStartTimedExam = () => {
  const exam = useExam();
  const fail = useFailAction();
  return useAttemptAction('startTimedExam', {
    run: async () => {
      if (!exam.id) {
        return fail('Failed to start exam. No exam id.', 'Failed to start exam. No exam id was found.');
      }
      return createExamAttempt(exam.id, exam.use_legacy_attempt_api);
    },
  });
};

export const useCreateProctoredExamAttempt = () => {
  const exam = useExam();
  const fail = useFailAction();
  return useAttemptAction('createProctoredExamAttempt', {
    run: async () => {
      if (!exam.id) {
        return fail('Failed to create exam attempt. No exam id.');
      }
      return createExamAttempt(exam.id, exam.use_legacy_attempt_api, false, true);
    },
  });
};

export const useStartProctoredExam = () => {
  const exam = useExam();
  const fail = useFailAction();
  const apiError = useApiError();
  return useAttemptAction('startProctoredExam', {
    run: async () => {
      const { attempt } = exam || {};
      if (!exam.id) {
        return fail('Failed to start proctored exam. No exam id.');
      }
      const { desktop_application_js_url: workerUrl } = attempt || {};
      const useWorker = window.Worker && workerUrl;
      const examHasLtiProvider = !attempt.use_legacy_attempt_api;

      if (useWorker) {
        try {
          await workerPromiseForEventNames(actionToMessageTypesMap.start, exam.attempt.desktop_application_js_url)(
            EXAM_START_TIMEOUT_MILLISECONDS,
            attempt.external_id,
          );
        } catch (error) {
          const message = (error as ApiError)?.message || 'Worker failed to respond.';
          logError(message, {
            attemptId: attempt.attempt_id,
            attemptStatus: attempt.attempt_status,
            courseId: attempt.course_id,
            examId: exam.id,
          });
          apiError({ message: 'Something has gone wrong starting your exam. Please double-check that the application is running.' });
          return undefined;
        }
      } else if (examHasLtiProvider) {
        notifyStartExam();
      }
      return continueAttempt(attempt.attempt_id, attempt.use_legacy_attempt_api);
    },
  });
};

export const useSkipProctoringExam = () => {
  const exam = useExam();
  const fail = useFailAction();
  return useAttemptAction('skipProctoringExam', {
    run: async () => {
      if (!exam.id) {
        return fail('Failed to skip proctored exam. No exam id.');
      }
      const attemptId = exam.attempt.attempt_id;
      const useLegacyAttemptApi = exam.use_legacy_attempt_api;
      return attemptId
        ? declineAttempt(attemptId, useLegacyAttemptApi)
        : createExamAttempt(exam.id, useLegacyAttemptApi);
    },
  });
};

export const useStopExam = () => {
  const exam = useExam();
  const activeAttempt = useActiveAttempt();
  const fail = useFailAction();
  const apiError = useApiError();
  return useAttemptAction('stopExam', {
    run: async () => {
      if (!activeAttempt) {
        return fail('Failed to stop exam. No active attempt.', 'Failed to stop exam. No active attempt was found.');
      }
      const {
        attempt_id: attemptId,
        exam_url_path: examUrl,
        use_legacy_attempt_api: useLegacyAttemptAPI,
      } = activeAttempt;
      if (!exam.attempt || attemptId !== exam.attempt.attempt_id) {
        try {
          await stopAttempt(attemptId, useLegacyAttemptAPI);
          window.location.href = examUrl;
        } catch (error) {
          apiError(error as ApiError);
        }
        return undefined;
      }
      return stopAttempt(attemptId, useLegacyAttemptAPI);
    },
  });
};

export const useContinueExam = () => {
  const exam = useExam();
  const fail = useFailAction();
  return useAttemptAction('continueExam', {
    run: async () => {
      const attemptId = exam.attempt.attempt_id;
      const useLegacyAttemptAPI = exam.attempt.use_legacy_attempt_api;
      if (!attemptId) {
        return fail('Failed to continue exam. No attempt id.', 'Failed to continue exam. No attempt id was found.');
      }
      return continueAttempt(attemptId, useLegacyAttemptAPI);
    },
  });
};

export const useResetExam = () => {
  const exam = useExam();
  const fail = useFailAction();
  return useAttemptAction('resetExam', {
    run: async () => {
      const attemptId = exam.attempt.attempt_id;
      const useLegacyAttemptAPI = exam.attempt.use_legacy_attempt_api;
      if (!attemptId) {
        return fail('Failed to reset exam attempt. No attempt id.', 'Failed to reset exam attempt. No attempt id was found.');
      }
      return resetAttempt(attemptId, useLegacyAttemptAPI);
    },
  });
};

export const useSubmitExam = () => {
  const exam = useExam();
  const activeAttempt = useActiveAttempt();
  const fail = useFailAction();
  const apiError = useApiError();
  const notifyWorkerOfSubmit = useNotifyWorkerOfSubmit();
  return useAttemptAction('submitExam', {
    run: async () => {
      if (!activeAttempt) {
        return fail('Failed to submit exam. No active attempt.', 'Failed to submit exam. No active attempt was found.');
      }
      const {
        attempt_id: attemptId,
        exam_url_path: examUrl,
        use_legacy_attempt_api: useLegacyAttemptAPI,
      } = activeAttempt;
      if (!exam.attempt || attemptId !== exam.attempt.attempt_id) {
        try {
          await submitAttempt(attemptId, useLegacyAttemptAPI);
          window.location.href = examUrl;
          notifyWorkerOfSubmit();
        } catch (error) {
          apiError(error as ApiError);
        }
        return undefined;
      }
      return submitAttempt(attemptId, useLegacyAttemptAPI);
    },
    after: notifyWorkerOfSubmit,
  });
};

export const useExpireExam = () => {
  const activeAttempt = useActiveAttempt();
  const { sequenceId, isTimeLimited } = useSequenceExam();
  const dispatch = useDispatch();
  const fail = useFailAction();
  const notifyWorkerOfSubmit = useNotifyWorkerOfSubmit();
  return useAttemptAction('expireExam', {
    run: async () => {
      const attemptId = activeAttempt?.attempt_id;
      const useLegacyAttemptAPI = activeAttempt?.use_legacy_attempt_api;
      if (!attemptId) {
        return fail('Failed to expire exam. No attempt id.', 'Failed to expire exam. No attempt id was found.');
      }
      return submitAttempt(attemptId, useLegacyAttemptAPI);
    },
    // this sure looks like a bug
    refetchKey: () => (isTimeLimited
      ? specialExamsQueryKeys.exam(activeAttempt!.course_id, sequenceId)
      : specialExamsQueryKeys.activeAttempt(activeAttempt!.course_id)),
    after: () => {
      dispatch(expireExamAttempt());
      notifyWorkerOfSubmit();
    },
  });
};

interface EndExamWithFailureVariables {
  attemptId: number;
  message: string;
  useLegacyAttemptAPI?: boolean;
}

export const useEndExamWithFailure = () => useAttemptAction<EndExamWithFailureVariables>('endExamWithFailure', {
  run: ({ attemptId, message, useLegacyAttemptAPI }) => endExamWithFailure(attemptId, message, useLegacyAttemptAPI),
});
