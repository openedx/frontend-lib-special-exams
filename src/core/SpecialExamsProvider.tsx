import React, { createContext, useContext, useMemo } from 'react';

export interface SpecialExamsConfig {
  /** Unset selects the LMS edx_proctoring endpoints; set, the edx-exams service. */
  examsBaseUrl?: string | null;
  lmsBaseUrl?: string;
  siteName?: string;
  supportUrl?: string;
  contactUrl?: string;
  proctoredExamFaqUrl?: string;
  proctoredExamRulesUrl?: string;
}

/** The part of an axios instance the library calls; the host's client authenticates its requests. */
export interface HttpClient {
  get: <T = unknown>(url: string) => Promise<{ data: T }>;
  post: <T = unknown>(url: string, payload?: unknown) => Promise<{ data: T }>;
  put: <T = unknown>(url: string, payload?: unknown) => Promise<{ data: T }>;
}

export type LogError = (message: unknown, customAttributes?: Record<string, unknown>) => void;

export interface SpecialExamsServices {
  config: SpecialExamsConfig;
  httpClient: HttpClient;
  logError: LogError;
  isAuthenticated: boolean;
}

const SpecialExamsContext = createContext<SpecialExamsServices | null>(null);

export const useSpecialExams = (): SpecialExamsServices => {
  const services = useContext(SpecialExamsContext);
  if (!services) {
    throw new Error('SpecialExamsProvider is required above the special exams components.');
  }
  return services;
};

const SpecialExamsProvider = ({
  config, httpClient, logError, isAuthenticated, children,
}: SpecialExamsServices & { children: React.ReactNode }) => {
  const services = useMemo(() => ({
    config, httpClient, logError, isAuthenticated,
  }), [config, httpClient, logError, isAuthenticated]);
  return <SpecialExamsContext.Provider value={services}>{children}</SpecialExamsContext.Provider>;
};

export default SpecialExamsProvider;
