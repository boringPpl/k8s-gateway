import { get, assign } from 'lodash/fp';
import { build } from './manifest-builder';
import { transform } from '../kernels/transformer';

export const createKernel = ({ pod, service, ingress }) => {
  const kernel = build({ pod });
  if (service) Object.assign(kernel, build({ service: assign(service)(kernel) }));
  if (service && ingress) Object.assign(kernel, build({ ingress: assign(ingress)(kernel) }));

  if (!get('pod.metadata.name')(kernel)) {
    return Promise.reject(new Error('Missing Pod Name'));
  }

  if (kernel.service && !get('service.metadata.name')(kernel)) {
    return Promise.reject(new Error('Missing Service Name'));
  }

  if (kernel.ingress && !get('ingress.metadata.name')(kernel)) {
    return Promise.reject(new Error('Missing Ingress Name'));
  }

  return Promise.resolve({
    ...transform(kernel.pod),
    phase: 'PENDING',
  });
};

export const deleteKernel = () => Promise.resolve();
export const getKernel = () => Promise.resolve(transform({ metadata: { name: 'test' } }));
export const getKernels = () => Promise.resolve({ data: [transform({ metadata: { name: 'test' } })] });
export const refreshDeployment = () => Promise.resolve({});
