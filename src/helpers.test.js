/* eslint-disable react/jsx-filename-extension */
import React from 'react';
import {
  isEmpty,
  getDisplayName,
  shouldRenderExpiredPage,
  generateHumanizedTime,
  appendTimerEnd,
} from './helpers';
import { ExamType } from './constants';

/**
 * This test file focuses on achieving 100% coverage for the helpers.js module.
 * While some of these functions are used in other components and may be indirectly tested,
 * this file provides explicit tests for all edge cases and branches.
 */

// Mock the IS_INCOMPLETE_STATUS function to control its behavior in tests
jest.mock('./constants', () => {
  const originalModule = jest.requireActual('./constants');
  return {
    ...originalModule,
    // We're mocking this function and using it indirectly in shouldRenderExpiredPage tests
    IS_INCOMPLETE_STATUS: jest.fn((status) => ['created', 'started'].includes(status)),
  };
});

describe('isEmpty', () => {
  /**
   * The isEmpty function is used in multiple places including thunks.js and instructions/index.jsx,
   * but the edge cases (null/undefined) aren't explicitly tested elsewhere.
   */
  it('should return true for null values', () => {
    // Tests the first condition in isEmpty: if (!obj) { return true; }
    expect(isEmpty(null)).toBe(true);
  });

  it('should return true for undefined values', () => {
    // Tests the first condition in isEmpty: if (!obj) { return true; }
    expect(isEmpty(undefined)).toBe(true);
  });

  it('should return true for empty objects', () => {
    // Tests the second condition: Object.keys(obj).length === 0
    expect(isEmpty({})).toBe(true);
  });

  it('should return false for non-empty objects', () => {
    // Tests the negative case where both conditions fail
    expect(isEmpty({ key: 'value' })).toBe(false);
  });
});

describe('getDisplayName', () => {
  /**
   * The getDisplayName function isn't tested elsewhere in the codebase,
   * so we need to test all branches here.
   */
  it('should return displayName if available', () => {
    // Tests the first condition: WrappedComponent.displayName
    const Component = () => <div />;
    Component.displayName = 'CustomDisplayName';
    expect(getDisplayName(Component)).toBe('CustomDisplayName');
  });

  it('should return name if displayName is not available', () => {
    // Tests the second condition: WrappedComponent.name
    const TestComponent = () => <div />;
    expect(getDisplayName(TestComponent)).toBe('TestComponent');
  });

  it('should return "Component" if neither displayName nor name is available', () => {
    // Tests the fallback case: 'Component'
    const component = { render: () => <div /> };
    expect(getDisplayName(component)).toBe('Component');
  });
});

describe('shouldRenderExpiredPage', () => {
  /**
   * While shouldRenderExpiredPage is used in instructions/index.jsx,
   * not all branches are explicitly tested there.
   */
  it('should return false if exam is not passed due date', () => {
    // Tests the first condition: if (!passedDueDate || examType === ExamType.PRACTICE) { return false; }
    const exam = {
      type: ExamType.TIMED,
      passed_due_date: false,
      attempt: { attempt_id: '123', attempt_status: 'started' },
    };
    expect(shouldRenderExpiredPage(exam)).toBe(false);
  });

  it('should return false if exam is practice type, even if passed due date', () => {
    // Tests the second part of the first condition: examType === ExamType.PRACTICE
    const exam = {
      type: ExamType.PRACTICE,
      passed_due_date: true,
      attempt: { attempt_id: '123', attempt_status: 'started' },
    };
    expect(shouldRenderExpiredPage(exam)).toBe(false);
  });

  it('should return true if exam is passed due date and attempt is empty', () => {
    // Tests the first part of the return condition: isEmpty(attempt)
    const exam = {
      type: ExamType.TIMED,
      passed_due_date: true,
      attempt: {},
    };
    expect(shouldRenderExpiredPage(exam)).toBe(true);
  });

  it('should return true if exam is passed due date and has no attempt_id', () => {
    // Tests the second part of the return condition: !attempt.attempt_id
    const exam = {
      type: ExamType.TIMED,
      passed_due_date: true,
      attempt: { attempt_status: 'created' },
    };
    expect(shouldRenderExpiredPage(exam)).toBe(true);
  });

  it('should return true if exam is passed due date and attempt status is incomplete', () => {
    // Tests the third part of the return condition: IS_INCOMPLETE_STATUS(attempt.attempt_status)
    const exam = {
      type: ExamType.TIMED,
      passed_due_date: true,
      attempt: { attempt_id: '123', attempt_status: 'created' },
    };
    expect(shouldRenderExpiredPage(exam)).toBe(true);
  });
});

describe('generateHumanizedTime', () => {
  /**
   * The generateHumanizedTime function is used in CountDownTimer.jsx and api.js,
   * but not all branches are explicitly tested.
   */
  it('should format time with only minutes when less than an hour', () => {
    // Tests when hours === 0
    expect(generateHumanizedTime(30 * 60)).toBe('30 minutes');
    expect(generateHumanizedTime(1 * 60)).toBe('1 minute');
  });

  it('should format time with hours and minutes when more than an hour', () => {
    // Tests when hours !== 0
    expect(generateHumanizedTime(90 * 60)).toBe('1 hour and 30 minutes');
    expect(generateHumanizedTime(60 * 60)).toBe('1 hour and 0 minutes');
    expect(generateHumanizedTime(120 * 60 + 1 * 60)).toBe('2 hours and 1 minute');
  });

  it('should handle plural forms correctly', () => {
    // Tests the plural handling for both hours and minutes
    expect(generateHumanizedTime(1 * 60)).toBe('1 minute');
    expect(generateHumanizedTime(2 * 60)).toBe('2 minutes');
    expect(generateHumanizedTime(60 * 60)).toBe('1 hour and 0 minutes');
    expect(generateHumanizedTime(120 * 60)).toBe('2 hours and 0 minutes');
  });
});

describe('appendTimerEnd', () => {
  /**
   * The appendTimerEnd function is used in TimerProvider.test.jsx and CountDownTimer.test.jsx,
   * but they don't test all edge cases.
   */
  beforeEach(() => {
    // Mock Date.now() to return a fixed timestamp for consistent testing
    jest.spyOn(Date, 'now').mockImplementation(() => 1609459200000); // 2021-01-01T00:00:00.000Z
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return the original attempt if time_remaining_seconds is not present', () => {
    // Tests the condition: if (!activeAttempt?.time_remaining_seconds) { return activeAttempt; }
    const attempt = { attempt_id: '123', attempt_status: 'started' };
    expect(appendTimerEnd(attempt)).toBe(attempt);
  });

  it('should return null if attempt is null', () => {
    // Tests the edge case of null input
    expect(appendTimerEnd(null)).toBe(null);
  });

  it('should return undefined if attempt is undefined', () => {
    // Tests the edge case of undefined input
    expect(appendTimerEnd(undefined)).toBe(undefined);
  });

  it('should add timer_ends property based on time_remaining_seconds', () => {
    // Tests the main functionality of adding the timer_ends property
    const attempt = {
      attempt_id: '123',
      attempt_status: 'started',
      time_remaining_seconds: 3600, // 1 hour
    };
    const result = appendTimerEnd(attempt);

    // 1 hour from mock date
    expect(result.timer_ends).toBe('2021-01-01T01:00:00.000Z');
    expect(result).not.toBe(attempt); // Should return a new object
    expect(result.attempt_id).toBe('123'); // Should preserve other properties
  });
});
