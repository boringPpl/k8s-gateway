import { Client } from 'kubernetes-client';
import Request from 'kubernetes-client/backends/request';
import {
  get, assign,
} from 'lodash/fp';

import { build } from './manifest-builder';
import retry from '../utils/retry';
import rollbackWaterFall from '../utils/rollback-waterfall';
import { updateKernelStatus } from '../webhooks/flownote';
import { statusToPhase, transform } from '../kernels/transformer';

const namespace = process.env.NAMESPACE || 'hasbrain';
const kernelRetry = retry({ delay: 2, retries: 2 });
const clients = {};

export const initClient = () => {
  const backend = new Request(Request.config.getInCluster());
  const client = new Client({ backend, version: '1.13' });

  const clientApiV1 = client.api.v1.namespaces(namespace);
  const clientApiV1Watch = client.api.v1.watch.namespaces(namespace);
  const clientApisExtensionsV1Beta1 = client.apis.extensions.v1beta1.namespaces(namespace);

  // TODO: Must match manifest version
  clients.pods = clientApiV1.pods;
  clients.services = clientApiV1.services;
  clients.ingresses = clientApisExtensionsV1Beta1.ingresses;
  clients.watch = clientApiV1Watch;
};

const defaultStopPhases = ['DELETED', 'FAILED', 'SUCCEEDED', 'UNKNOWN'];

export const watchKernel = (podName, react, stopPhases = defaultStopPhases) => clients.watch
  .pods(podName)
  .getObjectStream()
  .then(stream => new Promise((resolve, reject) => {
    let resolved = false;
    stream.on('data', ({ type, object }) => {
      if (type === 'ADDED') {
        resolved = true;
        resolve();
      }

      const phaseObj = statusToPhase({ type, status: object.status });
      if (stopPhases.includes(phaseObj.phase)) stream.destroy();
      if (react) react(object, phaseObj);
    });

    stream.on('error', (err) => {
      stream.destroy();
      if (!resolved) reject(err);
    });
  }));

export const createKernel = ({ pod, service, ingress }) => {
  if (!pod) return Promise.reject(new Error('Missing Pod'));

  const startKernel = {
    exec: (kernel) => {
      Object.assign(kernel, build({ pod }));
      return clients.pods.post({ body: kernel.pod });
    },
    rollback: (kernel) => {
      const podName = get('pod.metadata.name')(kernel);
      return clients.pods(podName).delete();
    },
  };

  const startService = {
    exec: (kernel) => {
      if (!service) return Promise.resolve();
      Object.assign(kernel, build({ service: assign(service)(kernel) }));
      return clients.services.post({ body: kernel.service });
    },
    rollback: (kernel) => {
      if (!service) return Promise.resolve();
      const serviceName = get('service.metadata.name')(kernel);
      return clients.services(serviceName).delete();
    },
  };

  const startIngress = {
    exec: (kernel) => {
      if (!ingress) return Promise.resolve(kernel);
      Object.assign(kernel, build({ ingress: assign(ingress)(kernel) }));
      return clients.ingresses.post({ body: kernel.ingress }).then(() => kernel);
    },
    rollback: (kernel) => {
      if (!ingress) return Promise.resolve();
      const ingressName = get('ingress.metadata.name')(kernel);
      return clients.ingresses(ingressName).delete();
    },
  };

  const watchStatus = {
    exec: (kernel) => {
      const podName = get('pod.metadata.name')(kernel);
      return watchKernel(podName, updateKernelStatus).then(() => kernel);
    },
  };

  return rollbackWaterFall([
    startKernel,
    startService,
    startIngress,
    watchStatus,
  ]);
};

export const deleteKernel = (podName, { serviceName, ingressName }) => {
  if (!podName) return Promise.reject(new Error('Missing Pod Name'));

  return clients.pods(podName).delete()
    .then(() => {
      kernelRetry({ exec: () => clients.services(serviceName || podName).delete() });
      kernelRetry({ exec: () => clients.ingresses(ingressName || podName).delete() });
    });
};

export const getKernel = (podName) => {
  if (!podName) return Promise.reject(new Error('Missing Pod Name'));

  return clients.pods(podName).get()
    .then(({ body }) => transform(body));
};

export const getKernels = ({
  fields = '', labels = '', limit = 100,
}) => clients.pods.get({
  qs: {
    fieldSelector: fields,
    labelSelector: labels,
    limit,
  },
})
  .then((resp) => {
    const items = get('body.items')(resp) || [];
    return { data: items.map(transform) };
  });
