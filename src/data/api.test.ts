import MockAdapter from 'axios-mock-adapter';

import { softwareDownloadAttempt } from './api';
import { httpClient, testConfig, testServices } from '../setupTest';

const axiosMock = new MockAdapter(httpClient);

describe('softwareDownloadAttempt', () => {
  afterEach(() => {
    axiosMock.reset();
  });

  it('records the download click on edx-exams', async () => {
    axiosMock.onPut(`${testConfig.examsBaseUrl}/api/v1/exams/attempt/1`).reply(200, { exam_attempt_id: 1 });

    await expect(softwareDownloadAttempt(testServices, 1)).resolves.toEqual({ exam_attempt_id: 1 });
    expect(axiosMock.history.put[0].data).toEqual(JSON.stringify({ action: 'click_download_software' }));
  });

  it('records the download click on the LMS for a legacy attempt', async () => {
    axiosMock.onPut(`${testConfig.lmsBaseUrl}/api/edx_proctoring/v1/proctored_exam/attempt/1`)
      .reply(200, { exam_attempt_id: 1 });

    await softwareDownloadAttempt(testServices, 1, true);

    expect(axiosMock.history.put[0].url).toEqual(`${testConfig.lmsBaseUrl}/api/edx_proctoring/v1/proctored_exam/attempt/1`);
  });
});
