/**
 * Custom integration with Proctorio browser extension
 *
 * Note: this is a temporary solution, we would like to avoid
 * vendor-specific integrations long term. As of now these events
 * will trigger on ANY lti integration, not just Proctorio.
 */
export function notifyStartExam() {
  window.top.postMessage(
    ['exam_state_change', 'exam_take'],
    '*', // this isn't emitting secure data so any origin is fine
  );
}

export function notifyEndExam() {
  window.top.postMessage(
    ['exam_state_change', 'exam_end'],
    '*', // this isn't emitting secure data so any origin is fine
  );
}
