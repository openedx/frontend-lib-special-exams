import '@testing-library/jest-dom';
import './data/__factories__';
import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { render as rtlRender } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import SequenceExamContext from './core/SequenceExamContext';
import SpecialExamsProvider from './core/SpecialExamsProvider';
import { specialExamsQueryKeys } from './data/queryKeys';
import { defaultExam } from './data/defaults';

window.getComputedStyle = jest.fn(() => ({
  getPropertyValue: jest.fn(),
}));

// The host services `SpecialExamsProvider` takes, as tests provide them.
export const testConfig = {
  lmsBaseUrl: 'http://localhost:18000',
  examsBaseUrl: 'http://localhost:18740',
  contactUrl: 'http://localhost:18000/contact',
  proctoredExamFaqUrl: '',
  proctoredExamRulesUrl: '',
};
export const httpClient = axios.create();
const loggingService = { logInfo: jest.fn(), logError: jest.fn() };
export const testServices = {
  config: testConfig, httpClient, logError: loggingService.logError, isAuthenticated: true,
};

export function initializeMockApp() {
  return { loggingService };
}

export const createTestQueryClient = () => new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

// Seeds the query cache with a `specialExams` fixture (the shape the `specialExams` factory builds and the
// old slice held) and returns the context the readers resolve it through; never-stale, so mounting
// observers do not refetch over it.
export const seedSpecialExams = (queryClient, specialExams) => {
  const {
    exam, activeAttempt = null, proctoringSettings, examAccessToken, reviewPolicy, allowProctoringOptOut,
  } = specialExams;
  const courseId = exam?.course_id;
  const sequenceId = exam?.content_id;
  // Readers key the per-exam queries off `useExam()`, which falls back to the default exam.
  const examCourseId = exam?.course_id ?? defaultExam.course_id;
  const examId = exam?.id ?? defaultExam.id;
  const seed = (queryKey, data) => {
    queryClient.setQueryDefaults(queryKey, { staleTime: Infinity });
    queryClient.setQueryData(queryKey, data);
  };
  seed(specialExamsQueryKeys.exam(courseId, sequenceId), { exam, activeAttempt });
  if (proctoringSettings) {
    seed(specialExamsQueryKeys.proctoringSettings(examCourseId, examId), proctoringSettings);
  }
  if (examAccessToken) {
    seed(specialExamsQueryKeys.accessToken(examId), examAccessToken);
  }
  const policy = reviewPolicy ?? exam?.reviewPolicy;
  if (policy !== undefined) {
    seed(specialExamsQueryKeys.reviewPolicy(examId), { review_policy: policy });
  }
  return {
    courseId, sequenceId, isTimeLimited: true, allowProctoringOptOut,
  };
};

// A `SequenceExamContext` provider for tests: the identity is fixed, the client state is real state
// seeded from `clientState`, and `clientState()` reads what the provider holds now.
export function createTestSequenceExam(sequenceExam = {}, initialClientState = {}) {
  const latest = { current: null };
  /** @param {{ children: React.ReactNode }} props */
  const SequenceExamProvider = ({ children }) => {
    const [timeIsOver, setTimeIsOver] = useState(initialClientState.timeIsOver ?? false);
    const [apiErrorMsg, setApiError] = useState(initialClientState.apiErrorMsg ?? '');
    const value = useMemo(() => ({
      ...sequenceExam, timeIsOver, apiErrorMsg, setTimeIsOver, setApiError,
    }), [timeIsOver, apiErrorMsg]);
    latest.current = value;
    // eslint-disable-next-line react/jsx-filename-extension
    return <SequenceExamContext.Provider value={value}>{children}</SequenceExamContext.Provider>;
  };
  SequenceExamProvider.propTypes = {
    children: PropTypes.node.isRequired,
  };
  const clientState = () => ({ timeIsOver: latest.current.timeIsOver, apiErrorMsg: latest.current.apiErrorMsg });
  return { SequenceExamProvider, clientState };
}

function render(
  ui,
  {
    services = {},
    queryClient = createTestQueryClient(),
    specialExams = null,
    sequenceExam = {},
    clientState = {},
    ...renderOptions
  } = {},
) {
  const identity = { ...(specialExams ? seedSpecialExams(queryClient, specialExams) : {}), ...sequenceExam };
  const { SequenceExamProvider } = createTestSequenceExam(identity, clientState);
  const specialExamsServices = { ...testServices, ...services, config: { ...testConfig, ...services.config } };
  const Wrapper = ({ children }) => (
    // eslint-disable-next-line react/jsx-filename-extension
    <SpecialExamsProvider {...specialExamsServices}>
      <IntlProvider locale="en">
        <QueryClientProvider client={queryClient}>
          <SequenceExamProvider>
            {children}
          </SequenceExamProvider>
        </QueryClientProvider>
      </IntlProvider>
    </SpecialExamsProvider>
  );

  Wrapper.propTypes = {
    children: PropTypes.node.isRequired,
  };

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything.
export * from '@testing-library/react';

// Override `render` method.
export {
  render,
};
