import '@testing-library/jest-dom';
import { Factory } from 'rosie';
import React from 'react';
import { PluginSlot } from '@openedx/frontend-plugin-framework';
import SubmittedTimedExamInstructionsSlot from './index';
import {
  render, screen, initializeMockApp, initializeTestStore,
} from '../../setupTest';

// Mock the PluginSlot component to capture its props.
jest.mock('@openedx/frontend-plugin-framework', () => ({
  PluginSlot: jest.fn(({ children, id, pluginProps }) => (
    <div data-testid="plugin-slot" data-slot-id={id} data-plugin-props={JSON.stringify(pluginProps)}>
      {children}
    </div>
  )),
}));

describe('SubmittedTimedExamInstructionsSlot', () => {
  let store;

  beforeEach(() => {
    initializeMockApp();
    store = initializeTestStore();
    jest.clearAllMocks();
  });

  describe('Default content rendering', () => {
    it.each([
      {
        description: 'when timeIsOver is false',
        stateSetup: () => ({ specialExams: Factory.build('specialExams', { timeIsOver: false }) }),
        expectedMessage: 'You have submitted your timed exam.',
      },
      {
        description: 'when timeIsOver is true',
        stateSetup: () => ({ specialExams: Factory.build('specialExams', { timeIsOver: true }) }),
        expectedMessage: /The time allotted for this exam has expired/,
      },
      {
        description: 'when Redux state is missing',
        stateSetup: () => ({}),
        expectedMessage: 'You have submitted your timed exam.',
      },
    ])('renders correct message for $description', ({ stateSetup, expectedMessage }) => {
      store.getState = stateSetup;

      render(<SubmittedTimedExamInstructionsSlot />, { store });

      expect(screen.getByTestId('plugin-slot')).toBeInTheDocument();
      expect(screen.getByTestId('exam.submittedExamInstructions.title')).toBeInTheDocument();
      expect(screen.getByText(expectedMessage)).toBeInTheDocument();
    });
  });

  describe('Plugin configuration', () => {
    it.each([
      { timeIsOver: false },
      { timeIsOver: true },
    ])('passes correct props and slot ID when timeIsOver is $timeIsOver', ({ timeIsOver }) => {
      const examState = Factory.build('specialExams', { timeIsOver });
      store.getState = () => ({ specialExams: examState });

      render(<SubmittedTimedExamInstructionsSlot />, { store });

      expect(PluginSlot).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'org.openedx.frontend.special_exams.submitted_timed_exam_instructions.v1',
          pluginProps: { timeIsOver },
          children: expect.anything(),
        }),
        expect.anything(),
      );

      const pluginSlot = screen.getByTestId('plugin-slot');
      expect(pluginSlot).toHaveAttribute('data-plugin-props', JSON.stringify({ timeIsOver }));
      expect(pluginSlot).toHaveAttribute(
        'data-slot-id',
        'org.openedx.frontend.special_exams.submitted_timed_exam_instructions.v1',
      );
    });
  });
});
