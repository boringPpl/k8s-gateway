import { get, assign } from 'lodash/fp';
import { remove } from 'lodash';
import { build, buildSecret, buildDaemonset } from './manifest-builder';
import { transform } from './kernels/transformer';

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

  const output = { ...transform(kernel.pod), phase: 'PENDING' };
  kernels.push(output);

  return Promise.resolve(output);
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

const daemonsets = [];

export const createDaemonset = (body) => {
  const daemonset = buildDaemonset(body);
  const existedDaemonsetIdx = daemonsets.findIndex(x => x.metadata.name === body.name);
  if (existedDaemonsetIdx >= 0) {
    // replace the old one
    // equivalent to `put` in real client
    daemonsets.splice(existedDaemonsetIdx, 1, daemonset);
  } else {
    daemonsets.push(daemonset);
  }
  return Promise.resolve({
    body: daemonset,
    statusCode: 201, // created
  });
};
export const deleteDaemonset = (name) => {
  remove(daemonsets, k => k.name === name);
  return Promise.resolve();
};

export const watchKernels = ({ onData }) => {
  const kernel = kernels[0];
  if (!kernel) return Promise.reject(new Error('Kernel Not Found'));

  onData(kernel);
  return Promise.resolve({ destroy: () => {} });
};
