import '@testing-library/jest-dom';
import React from 'react';
import { render } from '../setupTest';
import ExamAPIError from './ExamAPIError';

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
      siteName: 'Open edX',
      supportUrl: 'https://support.example.org/',
    };

    const { getByTestId } = render(
      <ExamAPIError />,
      { specialExams: {}, services: { config } },
    );

    const supportLink = getByTestId('support-link');
    expect(supportLink).toHaveProperty('href', config.supportUrl);
    expect(supportLink).toHaveTextContent(`${config.siteName} Support`);
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
