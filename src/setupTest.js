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
import { IntlProvider } from '@edx/frontend-platform/i18n';
import examReducer from './data/slice';

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

export function initializeTestStore(preloadedState = null, overrideStore = true) {
  let store = configureStore({
    reducer: {
      specialExams: examReducer,
    },
  });
  if (preloadedState) {
    store = configureStore({
      reducer: {
        specialExams: examReducer,
      },
      preloadedState,
    });
  }
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
    ...renderOptions
  } = {},
) {
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
          <Provider store={store || globalStore}>
            {children}
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
