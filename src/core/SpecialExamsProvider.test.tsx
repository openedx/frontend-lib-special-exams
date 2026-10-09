import React from 'react';
import { renderHook } from '@testing-library/react';
import SpecialExamsProvider, { useSpecialExams } from './SpecialExamsProvider';
import { testServices } from '../setupTest';

describe('SpecialExamsProvider', () => {
  it('provides the host services to the hooks below it', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SpecialExamsProvider {...testServices}>{children}</SpecialExamsProvider>
    );

    const { result } = renderHook(() => useSpecialExams(), { wrapper });

    expect(result.current).toEqual(testServices);
  });

  it('is required: the hooks throw without it', () => {
    expect(() => renderHook(() => useSpecialExams()))
      .toThrow('SpecialExamsProvider is required above the special exams components.');
  });
});
