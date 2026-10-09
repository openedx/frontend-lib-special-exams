import {
  useCallback, useEffect, useMemo, useRef,
} from 'react';
import {
  queryOptions, useQuery, useQueryClient, type QueryKey, type UseQueryOptions, type UseQueryResult,
} from '@tanstack/react-query';

import {
  type ApiServices,
  fetchExamAccessToken,
  fetchExamAttemptsData,
  fetchExamReviewPolicy,
  fetchLatestAttempt,
  fetchProctoringSettings,
  pollExamAttempt,
} from './api';
import { pingApplication } from './messages/handlers';
import { checkAppStatus } from './messages/proctorio';
import { specialExamsQueryKeys } from './queryKeys';
import { defaultExam, defaultProctoringSettings } from './defaults';
import { isEmpty } from '../helpers';
import {
  ExamStatus, ExamType, IS_PROCTORED_STATUS, IS_STARTED_STATUS,
} from '../constants';
import { useSequenceExam } from '../core/SequenceExamContext';
import { useSpecialExams } from '../core/SpecialExamsProvider';
import type {
  AttemptPayload, ExamAccessTokenPayload, ExamPayload, ExamState, PollPayload, ProctoringSettingsPayload,
  ReviewPolicyPayload,
} from './types';

const EXAM_START_TIMEOUT_MILLISECONDS = 5000;
const POLL_INTERVAL_MILLISECONDS = 60 * 1000;

export { specialExamsQueryKeys };

export { defaultExam, defaultProctoringSettings };

interface ApiError {
  message?: string;
  detail?: string;
}

type QueryOptions<T> = Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>;

const toExamState = (data: { exam: ExamPayload; active_attempt?: AttemptPayload | {} }): ExamState => ({
  exam: data.exam,
  activeAttempt: isEmpty(data.active_attempt) ? null : (data.active_attempt as AttemptPayload),
});

// The exam of one sequence and the attempt running in its course, fetched together.
export const examQueryOptions = (services: ApiServices, courseId?: string, sequenceId?: string) => queryOptions({
  queryKey: specialExamsQueryKeys.exam(courseId, sequenceId),
  queryFn: async () => toExamState(await fetchExamAttemptsData(services, courseId, sequenceId)),
  staleTime: Infinity,
});

export const useExamQuery = (
  courseId?: string,
  sequenceId?: string,
  options?: QueryOptions<ExamState>,
) => {
  const services = useSpecialExams();
  return useQuery({ ...examQueryOptions(services, courseId, sequenceId), ...options });
};

// The attempt running in a course, for pages with no sequence.
export const activeAttemptQueryOptions = (services: ApiServices, courseId?: string) => queryOptions({
  queryKey: specialExamsQueryKeys.activeAttempt(courseId),
  queryFn: async () => toExamState(await fetchLatestAttempt(services, courseId)),
  staleTime: Infinity,
});

export const useActiveAttemptQuery = (
  courseId?: string,
  options?: QueryOptions<ExamState>,
) => {
  const services = useSpecialExams();
  return useQuery({ ...activeAttemptQueryOptions(services, courseId), ...options });
};

export const useProctoringSettingsQuery = (
  courseId?: string,
  examId?: number | null,
  options?: QueryOptions<ProctoringSettingsPayload>,
) => {
  const services = useSpecialExams();
  return useQuery({
    queryKey: specialExamsQueryKeys.proctoringSettings(courseId, examId),
    queryFn: () => fetchProctoringSettings(services, courseId, examId),
    staleTime: Infinity,
    placeholderData: defaultProctoringSettings,
    ...options,
  });
};

export const useReviewPolicyQuery = (examId?: number | null) => {
  const services = useSpecialExams();
  return useQuery<ReviewPolicyPayload>({
    queryKey: specialExamsQueryKeys.reviewPolicy(examId),
    queryFn: () => fetchExamReviewPolicy(services, examId),
    staleTime: Infinity,
    enabled: !!examId,
  });
};

export const useAccessTokenQuery = (examId?: number | null) => {
  const services = useSpecialExams();
  return useQuery<ExamAccessTokenPayload>({
    queryKey: specialExamsQueryKeys.accessToken(examId),
    queryFn: () => fetchExamAccessToken(services, examId),
    enabled: !!examId && !!services.config.examsBaseUrl,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

// Surfaces a query's failure the way the thunks did, as the error message the page shows.
export const useReportQueryError = (query: { error: unknown }) => {
  const { setApiError } = useSequenceExam();
  useEffect(() => {
    if (query.error) {
      const { message, detail } = query.error as ApiError;
      setApiError(message || detail || '');
    }
  }, [query.error, setApiError]);
};

// Readers. The query that holds the exam state depends on where the reader renders: under an exam
// sequence it is the sequence's exam query, elsewhere the course's active-attempt query. Readers never
// fetch; the owner (`ExamWrapper` or `OuterExamTimer`) does.
const useExamState = (): UseQueryResult<ExamState> => {
  const { courseId, sequenceId, isTimeLimited } = useSequenceExam();
  const examQuery = useExamQuery(courseId, sequenceId, { enabled: false });
  const attemptQuery = useActiveAttemptQuery(courseId, { enabled: false });
  return isTimeLimited ? examQuery : attemptQuery;
};

export const useExamStateKey = (): QueryKey => {
  const { courseId, sequenceId, isTimeLimited } = useSequenceExam();
  return useMemo(() => (isTimeLimited
    ? specialExamsQueryKeys.exam(courseId, sequenceId)
    : specialExamsQueryKeys.activeAttempt(courseId)), [courseId, sequenceId, isTimeLimited]);
};

export const useExam = (): ExamPayload => useExamState().data?.exam ?? defaultExam;

// `timer_ends` is derived when the attempt is stored, as `appendTimerEnd` did at write time.
const withTimerEnd = (attempt: AttemptPayload | null, dataUpdatedAt: number) => {
  if (!attempt?.time_remaining_seconds) {
    return attempt;
  }
  return { ...attempt, timer_ends: new Date(dataUpdatedAt + attempt.time_remaining_seconds * 1000).toISOString() };
};

export const useActiveAttempt = (): AttemptPayload | null => {
  const { data, dataUpdatedAt } = useExamState();
  const attempt = data?.activeAttempt ?? null;
  return useMemo(() => withTimerEnd(attempt, dataUpdatedAt), [attempt, dataUpdatedAt]);
};

// An exam sequence is loading until its exam has data and during every re-fetch; a sequence that
// is not an exam never is (its exam query is disabled, which React Query 5 also reports as pending).
export const useIsExamLoading = () => {
  const { courseId, sequenceId, isTimeLimited } = useSequenceExam();
  const { isPending, isFetching } = useExamQuery(courseId, sequenceId, { enabled: false });
  return !!isTimeLimited && (isPending || isFetching);
};

export const useIsExam = () => {
  const { courseId, sequenceId } = useSequenceExam();
  return !!useExamQuery(courseId, sequenceId, { enabled: false }).data?.exam?.id;
};

export const useProctoringSettings = (): ProctoringSettingsPayload => {
  const exam = useExam();
  return useProctoringSettingsQuery(exam.course_id, exam.id, { enabled: false }).data ?? defaultProctoringSettings;
};

export const useInvalidateExamState = () => {
  const queryClient = useQueryClient();
  const queryKey = useExamStateKey();
  return useCallback(() => queryClient.invalidateQueries({ queryKey }), [queryClient, queryKey]);
};

// Writes a poll reply's remaining time and status over the attempt; an empty cache entry stays empty.
export const withPolledAttempt = (data: PollPayload) => (state?: ExamState) => (state ? {
  ...state,
  activeAttempt: {
    ...state.activeAttempt,
    time_remaining_seconds: data.time_remaining_seconds,
    attempt_status: data.status,
  } as AttemptPayload,
} : state);

// The poll: the attempt's status and remaining time, re-read every minute while the exam runs, written
// over the attempt in whichever query holds it. A `submitted` / `error` status ends the exam.
export const usePollQuery = (enabled: boolean) => {
  const queryClient = useQueryClient();
  const services = useSpecialExams();
  const { setApiError, setTimeIsOver } = useSequenceExam();
  const queryKey = useExamStateKey();
  const attempt = useActiveAttempt();
  const exam = useExam();
  const invalidateExamState = useInvalidateExamState();
  const pollQuery = useQuery<PollPayload>({
    queryKey: specialExamsQueryKeys.poll(attempt?.attempt_id),
    queryFn: () => pollExamAttempt(services, attempt?.exam_started_poll_url, exam.content_id),
    enabled: enabled && !!attempt && IS_STARTED_STATUS(attempt.attempt_status)
      && attempt.attempt_status !== ExamStatus.READY_TO_SUBMIT,
    refetchInterval: POLL_INTERVAL_MILLISECONDS,
    refetchIntervalInBackground: true,
    staleTime: 0,
    gcTime: 0,
  });
  useReportQueryError(pollQuery);
  const { data, dataUpdatedAt } = pollQuery;
  useEffect(() => {
    if (!data) {
      return;
    }
    // Dated at the poll's reply, so `timer_ends` is re-anchored from the time the server answered.
    queryClient.setQueryData<ExamState>(queryKey, withPolledAttempt(data), { updatedAt: dataUpdatedAt });
    setApiError('');
    if (([ExamStatus.SUBMITTED, ExamStatus.ERROR] as string[]).includes(data.status)) {
      setTimeIsOver(true);
      invalidateExamState();
    }
  }, [data, dataUpdatedAt, queryClient, queryKey, setApiError, setTimeIsOver, invalidateExamState]);
};

interface EndExamWithFailure {
  mutate: (variables: { attemptId: number; message: string; useLegacyAttemptAPI?: boolean }) => void;
}

// Ping the proctoring desktop app; a missed reply ends the exam with an error. The ticker calls this
// from a long-lived interval, so the function is stable and reads the attempt and exam current when it fires.
export const usePingAttempt = (endExamWithFailure: EndExamWithFailure) => {
  const attempt = useActiveAttempt();
  const exam = useExam();
  const { logError } = useSpecialExams();
  const latest = useRef({
    attempt, exam, endExamWithFailure, logError,
  });
  useEffect(() => {
    latest.current = {
      attempt, exam, endExamWithFailure, logError,
    };
  });
  return useCallback((timeoutInSeconds: number, workerUrl: string) => {
    const {
      attempt: currentAttempt, exam: currentExam, endExamWithFailure: endExam, logError: log,
    } = latest.current;
    const onFailure = (error: ApiError) => {
      const message = error?.message || 'Worker failed to respond.';
      /**
       * Note: The exam id logged here represents the current section being rendered.
       * This may be different from the exam they are currently attempting
       * if the learner has navigated to other course content during the exam.
       * */
      log(message, {
        attemptId: currentAttempt?.attempt_id,
        attemptStatus: currentAttempt?.attempt_status,
        courseId: currentAttempt?.course_id,
        examId: currentExam.id,
      });
      endExam.mutate({
        attemptId: currentAttempt!.attempt_id,
        message,
        useLegacyAttemptAPI: currentExam.attempt?.use_legacy_attempt_api,
      });
    };
    return pingApplication(timeoutInSeconds, currentAttempt?.external_id, workerUrl, log).catch(onFailure);
  }, []);
};

/**
 * Check if we are allowed to enter an exam where proctoring has started.
 * There is no support for reentry with LTI. The exam must be completed
 * in the proctored window. If a non-proctored window is opened, the exam will
 * be ended with an error.
 *
 * This check is necessary to prevent using a second browser to access the exam
 * content unproctored.
 */
export const useCheckExamEntry = (
  examQuery: { data?: ExamState; isFetching: boolean },
  endExamWithFailure: EndExamWithFailure,
) => {
  const { setApiError } = useSequenceExam();
  const { config: { examsBaseUrl } } = useSpecialExams();
  const checked = useRef(false);
  const mounted = useRef(true);
  const timeout = useRef<ReturnType<typeof setTimeout>>();
  const { data, isFetching } = examQuery;
  // A probe still waiting when the sequence unmounts must not end the attempt.
  useEffect(() => () => {
    mounted.current = false;
    clearTimeout(timeout.current);
  }, []);
  useEffect(() => {
    // Once per mount, against the attempt this mount's fetch returned, not a cached one.
    if (checked.current || isFetching || !data) {
      return;
    }
    checked.current = true;
    const { exam } = data;
    // Check only applies to LTI exams
    if (
      !exam?.attempt
      || exam.attempt.exam_type !== ExamType.PROCTORED
      || exam.attempt.use_legacy_attempt_api
    ) { return; }

    if (IS_PROCTORED_STATUS(exam.attempt.attempt_status)) {
      Promise.race([
        checkAppStatus(examsBaseUrl),
        new Promise((_, reject) => {
          timeout.current = setTimeout(() => reject(), EXAM_START_TIMEOUT_MILLISECONDS);
        }),
      ]).then(() => clearTimeout(timeout.current), () => {
        if (!mounted.current) {
          return;
        }
        setApiError('Something has gone wrong with your exam. Proctoring application not detected.');
        endExamWithFailure.mutate({ attemptId: exam.attempt.attempt_id!, message: 'exam reentry disallowed', useLegacyAttemptAPI: false });
      });
    }
  }, [data, isFetching, setApiError, endExamWithFailure, examsBaseUrl]);
};
