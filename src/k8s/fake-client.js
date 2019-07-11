import { get, assign } from 'lodash/fp';
import { remove } from 'lodash';
import { build, buildSecret } from './manifest-builder';
import { transform } from '../kernels/transformer';

const kernels = [];

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

  const rs = {
    ...transform(kernel.pod),
    phase: 'PENDING',
  };
  kernels.push(rs);
  return Promise.resolve(rs);
};

export const deleteKernel = (name) => {
  remove(kernels, k => k.name === name);
  return Promise.resolve();
};
export const getKernel = (name) => {
  const kernel = kernels.find(k => k.name === name);
  if (!kernel) return Promise.reject(new Error('Kernel Not Found'));
  return Promise.resolve(kernel);
};
export const getKernels = () => Promise.resolve({ data: [transform({ metadata: { name: 'test' } })] });
export const refreshDeployment = () => Promise.resolve({});
export const upsertSecret = (name, body) => Promise.resolve(buildSecret({ ...body, name }));
export const deleteSecret = name => Promise.resolve({ name });
export const updateKernel = (name, body) => {
  const kernel = kernels.find(k => k.name === name);
  if (!kernel) return Promise.reject(new Error('Kernel Not Found'));

  Object.keys(body).forEach((k) => {
    kernel[k] = body[k];
  });
  return Promise.resolve(kernel);
};
