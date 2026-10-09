export const specialExamsQueryKeys = {
  all: ['specialExams'] as const,
  exam: (courseId?: string, sequenceId?: string) => ['specialExams', 'exam', courseId, sequenceId] as const,
  activeAttempt: (courseId?: string) => ['specialExams', 'activeAttempt', courseId] as const,
  poll: (attemptId?: number) => ['specialExams', 'poll', attemptId] as const,
  proctoringSettings: (courseId?: string, examId?: number | null) => (
    ['specialExams', 'proctoringSettings', courseId, examId] as const
  ),
  reviewPolicy: (examId?: number | null) => ['specialExams', 'reviewPolicy', examId] as const,
  accessToken: (examId?: number | null) => ['specialExams', 'accessToken', examId] as const,
};
