import '@testing-library/jest-dom';
import React from 'react';
import { getConfig } from '@edx/frontend-platform';
import { store } from '../data';
import { render } from '../setupTest';
import ExamStateProvider from '../core/ExamStateProvider';
import ExamAPIError from './ExamAPIError';

const originalConfig = jest.requireActual('@edx/frontend-platform').getConfig();
jest.mock('@edx/frontend-platform', () => ({
  ...jest.requireActual('@edx/frontend-platform'),
  getConfig: jest.fn(),
}));
getConfig.mockImplementation(() => originalConfig);

jest.mock('../data', () => ({
  store: {},
}));
store.subscribe = jest.fn();
store.dispatch = jest.fn();

describe('ExamAPIError', () => {
  const defaultMessage = 'A system error has occurred with your exam.';

  it('renders with the default information', () => {
    store.getState = () => ({ examState: {} });

    const tree = render(
      <ExamStateProvider>
        <ExamAPIError />
      </ExamStateProvider>,
      { store },
    );

    expect(tree).toMatchSnapshot();
  });

  it('renders support link if site name and support url are given', () => {
    const config = {
      SITE_NAME: 'Open edX',
      SUPPORT_URL: 'https://support.example.org/',
    };
    getConfig.mockImplementation(() => config);

    store.getState = () => ({ examState: {} });

    const { getByTestId } = render(
      <ExamStateProvider>
        <ExamAPIError />
      </ExamStateProvider>,
      { store },
    );

    const supportLink = getByTestId('support-link');
    expect(supportLink).toHaveProperty('href', config.SUPPORT_URL);
    expect(supportLink).toHaveTextContent(`${config.SITE_NAME} Support`);
  });

  it('renders error details when provided', () => {
    store.getState = () => ({
      examState: { apiErrorMsg: 'Something bad has happened' },
    });

    const { queryByTestId } = render(
      <ExamStateProvider>
        <ExamAPIError />
      </ExamStateProvider>,
      { store },
    );

    expect(queryByTestId('error-details')).toHaveTextContent(store.getState().examState.apiErrorMsg);
  });

  it('renders default message when error is HTML', () => {
    store.getState = () => ({
      examState: { apiErrorMsg: '<Response is HTML>' },
    });

    const { queryByTestId } = render(
      <ExamStateProvider>
        <ExamAPIError />
      </ExamStateProvider>,
      { store },
    );

    expect(queryByTestId('error-details')).toHaveTextContent(defaultMessage);
  });

  it('renders default message when there is no error message', () => {
    store.getState = () => ({
      examState: { apiErrorMsg: '' },
    });

    const { queryByTestId } = render(
      <ExamStateProvider>
        <ExamAPIError />
      </ExamStateProvider>,
      { store },
    );

    expect(queryByTestId('error-details')).toHaveTextContent(defaultMessage);
  });
});
