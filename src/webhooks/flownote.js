import axios from 'axios';
import { get } from 'lodash/fp';
import url from 'url';

import retry from '../utils/retry';
import { statusToPhase, getMetadata } from '../kernels/transformer';

const statusRetry = retry({ delay: 1.5, retries: 2 });
const baseUrl = process.env.FLOWNOTE_SERVER;

export const updateKernelStatus = (kernel, phaseObj) => {
  if (!baseUrl || !url.parse(baseUrl).hostname) return Promise.resolve();

  return statusRetry({
    exec: () => axios.post(baseUrl, {
      query: `mutation($phase: KernelPhase!, $metadata: JSON!, $message: String) {
        kernelPhaseUpdated(phase: $phase, metadata: $metadata, message: $message)
      }`,
      variables: {
        metadata: getMetadata(kernel),
        ...(phaseObj || statusToPhase(kernel)),
      },
    }),
  })
    .catch((err) => {
      console.log('Response\n', get('response.data')(err));
      console.log('Update Kernel Phase: ', err.message);
    });
};
