import { get, assign } from 'lodash/fp';
import { build } from './manifest-builder';

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

  return Promise.resolve(kernel);
};

export const deleteKernel = () => Promise.resolve();
export const getKernel = () => Promise.resolve({ metadata: { name: 'test' }, status: 'RUNNING' });
export const getKernels = () => Promise.resolve({ data: [{ metadata: { name: 'test' }, status: 'RUNNING' }] });
