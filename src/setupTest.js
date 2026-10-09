import 'babel-polyfill';
import '@testing-library/jest-dom';
import './data/__factories__';
import { getConfig, mergeConfig } from '@edx/frontend-platform';
import { configure as configureLogging } from '@edx/frontend-platform/logging';
import { configure as configureAuth, MockAuthService } from '@edx/frontend-platform/auth';
import { AppContext } from '@edx/frontend-platform/react';
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { render as rtlRender } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import examReducer from './data/slice';
import SequenceExamContext from './core/SequenceExamContext';
import { specialExamsQueryKeys } from './data/queryKeys';
import { defaultExam } from './data/defaults';

// The library still reads its config, HTTP client, logger and messages from `@edx/frontend-platform`,
// whose entry module imports an `env.config` that only frontend-build's webpack resolved. This mock
// leaves with frontend-platform later in this PR.
jest.mock('env.config', () => ({}), { virtual: true });

window.getComputedStyle = jest.fn(() => ({
  getPropertyValue: jest.fn(),
}));

class MockLoggingService {
  constructor() {
    this.logInfo = jest.fn();
    this.logError = jest.fn();
  }
}

export function initializeTestConfig() {
  mergeConfig({
    ...process.env,
    EXAMS_BASE_URL: process.env.EXAMS_BASE_URL || null,
  });
}

export function initializeMockApp() {
  initializeTestConfig();
  const loggingService = configureLogging(MockLoggingService, {
    config: getConfig(),
  });
  const authService = configureAuth(MockAuthService, {
    config: getConfig(),
    loggingService,
  });

  return { loggingService, authService };
}

let globalStore;

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

// The store holds client state only (`timeIsOver`, `apiErrorMsg`); exam data is seeded through `render`'s
// `specialExams` option.
export function initializeTestStore(preloadedState = null, overrideStore = true) {
  const store = configureStore({
    reducer: {
      specialExams: examReducer,
    },
    preloadedState: preloadedState || undefined,
  });
  if (overrideStore) {
    globalStore = store;
  }
  return store;
}

function render(
  ui,
  {
    store = null,
    appContext = null,
    queryClient = createTestQueryClient(),
    specialExams = null,
    ...renderOptions
  } = {},
) {
  const sequenceExam = specialExams ? seedSpecialExams(queryClient, specialExams) : {};
  const reduxStore = store || globalStore || initializeTestStore(null, false);
  const Wrapper = ({ children }) => {
    const defaultAppContext = useMemo(() => ({
      authenticatedUser: {
        userId: 'abc123',
        username: 'Mock User',
        roles: [],
        administrator: false,
      },
    }), []);
    return (
      // eslint-disable-next-line react/jsx-filename-extension
      <AppContext.Provider value={appContext || defaultAppContext}>
        <IntlProvider locale="en">
          <Provider store={reduxStore}>
            <QueryClientProvider client={queryClient}>
              <SequenceExamContext.Provider value={sequenceExam}>
                {children}
              </SequenceExamContext.Provider>
            </QueryClientProvider>
          </Provider>
        </IntlProvider>
      </AppContext.Provider>
    );
  };

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
