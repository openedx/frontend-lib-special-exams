import '@testing-library/jest-dom';
import React from 'react';
import { getConfig } from '@edx/frontend-platform';
import { render } from '../setupTest';
import ExamAPIError from './ExamAPIError';

const originalConfig = jest.requireActual('@edx/frontend-platform').getConfig();
jest.mock('@edx/frontend-platform', () => ({
  ...jest.requireActual('@edx/frontend-platform'),
  getConfig: jest.fn(),
}));
getConfig.mockImplementation(() => originalConfig);

describe('ExamAPIError', () => {
  const defaultMessage = 'A system error has occurred with your exam.';

  beforeEach(() => {
  });

  it('renders with the default information', () => {
    const tree = render(
      <ExamAPIError />,
      { specialExams: {} },
    );

    expect(tree).toMatchSnapshot();
  });

  it('renders support link if site name and support url are given', () => {
    const config = {
      SITE_NAME: 'Open edX',
      SUPPORT_URL: 'https://support.example.org/',
    };
    getConfig.mockImplementation(() => config);

    const { getByTestId } = render(
      <ExamAPIError />,
      { specialExams: {} },
    );

    const supportLink = getByTestId('support-link');
    expect(supportLink).toHaveProperty('href', config.SUPPORT_URL);
    expect(supportLink).toHaveTextContent(`${config.SITE_NAME} Support`);
  });

  it('renders error details when provided', () => {
    const { queryByTestId } = render(
      <ExamAPIError />,
      { clientState: { apiErrorMsg: 'Something bad has happened' } },
    );

    expect(queryByTestId('error-details')).toHaveTextContent('Something bad has happened');
  });

  it('renders default message when error is HTML', () => {
    const { queryByTestId } = render(
      <ExamAPIError />,
      { clientState: { apiErrorMsg: '<Response is HTML>' } },
    );

    expect(queryByTestId('error-details')).toHaveTextContent(defaultMessage);
  });

  it('renders default message when there is no error message', () => {
    const { queryByTestId } = render(
      <ExamAPIError />,
      { clientState: { apiErrorMsg: '' } },
    );

    expect(queryByTestId('error-details')).toHaveTextContent(defaultMessage);
  });
});
