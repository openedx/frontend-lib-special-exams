import '@testing-library/jest-dom';
import React from 'react';
import { getConfig } from '@edx/frontend-platform';
import { initializeTestStore, render } from '../setupTest';
import ExamAPIError from './ExamAPIError';

const originalConfig = jest.requireActual('@edx/frontend-platform').getConfig();
jest.mock('@edx/frontend-platform', () => ({
  ...jest.requireActual('@edx/frontend-platform'),
  getConfig: jest.fn(),
}));
getConfig.mockImplementation(() => originalConfig);

describe('ExamAPIError', () => {
  const defaultMessage = 'A system error has occurred with your exam.';

  let store;

  beforeEach(() => {
    store = initializeTestStore();
  });

  it('renders with the default information', () => {
    store.getState = () => ({ specialExams: {} });

    const tree = render(
      <ExamAPIError />,
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

    store.getState = () => ({ specialExams: {} });

    const { getByTestId } = render(
      <ExamAPIError />,
      { store },
    );

    const supportLink = getByTestId('support-link');
    expect(supportLink).toHaveProperty('href', config.SUPPORT_URL);
    expect(supportLink).toHaveTextContent(`${config.SITE_NAME} Support`);
  });

  it('renders error details when provided', () => {
    store.getState = () => ({
      specialExams: { apiErrorMsg: 'Something bad has happened' },
    });

    const { queryByTestId } = render(
      <ExamAPIError />,
      { store },
    );

    expect(queryByTestId('error-details')).toHaveTextContent(store.getState().specialExams.apiErrorMsg);
  });

  it('renders default message when error is HTML', () => {
    store.getState = () => ({
      specialExams: { apiErrorMsg: '<Response is HTML>' },
    });

    const { queryByTestId } = render(
      <ExamAPIError />,
      { store },
    );

    expect(queryByTestId('error-details')).toHaveTextContent(defaultMessage);
  });

  it('renders default message when there is no error message', () => {
    store.getState = () => ({
      specialExams: { apiErrorMsg: '' },
    });

    const { queryByTestId } = render(
      <ExamAPIError />,
      { store },
    );

    expect(queryByTestId('error-details')).toHaveTextContent(defaultMessage);
  });
});
