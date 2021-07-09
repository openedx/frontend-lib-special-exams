import '@testing-library/jest-dom';
import React from 'react';
import { store } from '../data';
import { render, fireEvent } from '../setupTest';
import ExamStateProvider from '../core/ExamStateProvider';
import ExamAPIError from './ExamAPIError';

jest.mock('../data', () => ({
  store: {},
}));
store.subscribe = jest.fn();
store.dispatch = jest.fn();

describe('ExamAPiError', () => {
  it('shows heading with platform contact info if is is provided', () => {
    store.getState = () => ({
      examState: {
        apiErrorMsg: 'Something bad has happened',
        proctoringSettings: {
          contact_us: 'https://example.com',
          platform_name: 'Your Platform Name',
        },
      },
    });

    const { queryByTestId } = render(
      <ExamStateProvider>
        <ExamAPIError />
      </ExamStateProvider>,
      { store },
    );

    expect(queryByTestId('heading')).toBeInTheDocument();
    expect(queryByTestId('support-link')).toBeInTheDocument();
  });

  it('shows generic heading with no contact info if it is not provided', () => {
    store.getState = () => ({
      examState: {
        apiErrorMsg: 'Something bad has happened',
        proctoringSettings: {},
      },
    });

    const { queryByTestId } = render(
      <ExamStateProvider>
        <ExamAPIError />
      </ExamStateProvider>,
      { store },
    );

    const heading = queryByTestId('heading');
    const defaultMessage = 'A system error has occurred with your exam. Please reach out to support for assistance';
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent(defaultMessage);
    expect(queryByTestId('support-link')).not.toBeInTheDocument();
  });

  it('shows error details message and can show/hide it ', () => {
    store.getState = () => ({
      examState: {
        apiErrorMsg: 'Something bad has happened',
        proctoringSettings: {},
      },
    });

    const { queryByTestId } = render(
      <ExamStateProvider>
        <ExamAPIError />
      </ExamStateProvider>,
      { store },
    );

    const showButton = queryByTestId('show-button');
    expect(showButton).toBeInTheDocument();
    expect(showButton).toHaveTextContent('Show');
    expect(queryByTestId('error-details')).not.toBeInTheDocument();
    fireEvent.click(showButton);
    expect(showButton).toHaveTextContent('Hide');
    expect(queryByTestId('error-details')).toBeInTheDocument();
    expect(queryByTestId('error-details')).toHaveTextContent(store.getState().examState.apiErrorMsg);
    fireEvent.click(showButton);
    expect(showButton).toHaveTextContent('Show');
    expect(queryByTestId('error-details')).not.toBeInTheDocument();
  });
});
