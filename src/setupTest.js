import 'babel-polyfill';
import '@testing-library/jest-dom';
import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { render as rtlRender } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { IntlProvider } from 'react-intl';
import examReducer from './data/slice';

window.getComputedStyle = jest.fn(() => ({
  getPropertyValue: jest.fn(),
}));

let globalStore;

export async function initializeTestStore(options = null, overrideStore = true) {
  const preloadedState = options || {
    examState: {
      isLoading: true,
      timeIsOver: false,
      activeAttempt: {},
      proctoringSettings: {},
      exam: {},
    },
  };
  const store = configureStore({
    reducer: {
      examState: examReducer,
    },
    preloadedState,
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
    ...renderOptions
  } = {},
) {
  function Wrapper({ children }) {
    return (
      // eslint-disable-next-line react/jsx-filename-extension
      <IntlProvider locale="en">
        <Provider store={store || globalStore}>
          {children}
        </Provider>
      </IntlProvider>
    );
  }

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
