import '@testing-library/jest-dom';
import { Factory } from 'rosie';
import React from 'react';
import MockAdapter from 'axios-mock-adapter';
import OuterExamTimer from './OuterExamTimer';
import { fetchLatestAttempt } from '../data/api';
import {
  httpClient, render, screen, waitFor,
} from '../setupTest';
import { ExamStatus } from '../constants';

jest.mock('../data/api', () => ({
  ...jest.requireActual('../data/api'),
  fetchLatestAttempt: jest.fn(),
}));

const axiosMock = new MockAdapter(httpClient);

describe('OuterExamTimer', () => {
  afterEach(() => {
    axiosMock.reset();
  });

  const courseId = 'course-v1:test+test+test';

  beforeEach(() => {
    fetchLatestAttempt.mockResolvedValue({ exam: {}, active_attempt: {} });
  });

  it('returns null if there is no authenticated user', () => {
    const { container } = render(
      <OuterExamTimer courseId={courseId} />,
      { services: { isAuthenticated: false } },
    );

    expect(container.firstChild).toBeNull();
    expect(fetchLatestAttempt).not.toHaveBeenCalled();
  });

  it('asks for the latest attempt in the course', async () => {
    render(<OuterExamTimer courseId={courseId} />);

    await waitFor(() => expect(fetchLatestAttempt).toHaveBeenCalledWith(expect.anything(), courseId));
  });

  it('is successfully rendered and shows timer if there is an exam in progress', async () => {
    const attempt = Factory.build('attempt', {
      attempt_status: ExamStatus.STARTED,
    });
    fetchLatestAttempt.mockResolvedValue({ exam: { time_limit_mins: 60 }, active_attempt: attempt });

    render(<OuterExamTimer courseId={courseId} />);

    expect(await screen.findByTestId('exam-timer')).toBeInTheDocument();
  });

  it('does not render timer if there is no exam in progress', async () => {
    render(<OuterExamTimer courseId={courseId} />);

    await waitFor(() => expect(fetchLatestAttempt).toHaveBeenCalled());
    expect(screen.queryByTestId('exam-timer')).not.toBeInTheDocument();
  });

  it('shows the error when the latest-attempt request fails', async () => {
    fetchLatestAttempt.mockRejectedValue(new Error('Network Error'));

    render(<OuterExamTimer courseId={courseId} />);

    expect(await screen.findByTestId('exam-api-error-component')).toHaveTextContent('Network Error');
  });
});
