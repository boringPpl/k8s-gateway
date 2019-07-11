import axios from 'axios';
import { get, pick } from 'lodash/fp';
import url from 'url';

import retry from '../utils/retry';

const statusRetry = retry({ delay: 1.5, retries: 2 });
const baseUrl = process.env.FLOWNOTE_SERVER;

export const updateKernelStatus = (kernel) => {
  if (!baseUrl || !url.parse(baseUrl).hostname) return Promise.resolve();

  return statusRetry({
    exec: () => axios.post(baseUrl, {
      query: `mutation($phase: KernelPhase!, $metadata: JSON!, $message: String) {
        kernelPhaseUpdated(phase: $phase, metadata: $metadata, message: $message)
      }`,
      variables: pick(['metadata', 'phase', 'message'])(kernel),
    }),
  })
    .catch((err) => {
      console.log('Response\n', get('response.data')(err));
      console.log('Update Kernel Phase: ', err.message);
    });
};
