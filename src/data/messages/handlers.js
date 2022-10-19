import actionToMessageTypesMap from './constants';

function createWorker(url) {
  const blob = new Blob([`importScripts('${url}');`], { type: 'application/javascript' });
  const blobUrl = window.URL.createObjectURL(blob);
  return new Worker(blobUrl);
}

function workerTimeoutPromise(timeoutMilliseconds) {
  const message = `worker failed to respond after ${timeoutMilliseconds} ms`;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(Error(message));
    }, timeoutMilliseconds);
  });
}

export function workerPromiseForEventNames(eventNames, workerUrl) {
  return (timeout, attemptExternalId) => {
    const proctoringBackendWorker = createWorker(workerUrl);
    return new Promise((resolve, reject) => {
      const responseHandler = (e) => {
        if (e.data.type === eventNames.successEventName) {
          proctoringBackendWorker.removeEventListener('message', responseHandler);
          proctoringBackendWorker.terminate();
          resolve();
        } else {
          reject(e.data.error);
        }
      };
      proctoringBackendWorker.addEventListener('message', responseHandler);
      proctoringBackendWorker.postMessage({ type: eventNames.promptEventName, timeout, attemptExternalId });
    });
  };
}

export function pingApplication(timeoutInSeconds, workerUrl) {
  const TIMEOUT_BUFFER_SECONDS = 10;
  const workerPingTimeout = timeoutInSeconds - TIMEOUT_BUFFER_SECONDS; // 10s buffer for worker to respond
  return Promise.race([
    workerPromiseForEventNames(actionToMessageTypesMap.ping, workerUrl)(workerPingTimeout * 1000),
    workerTimeoutPromise(timeoutInSeconds * 1000),
  ]);
}
