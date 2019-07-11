import { Client } from 'kubernetes-client';
import Request from 'kubernetes-client/backends/request';
import {
  get, assign, flow, pick, toString, mapValues,
} from 'lodash/fp';

import { build, buildSecret } from './manifest-builder';
import rollbackWaterFall from '../utils/rollback-waterfall';
import { updateKernelStatus } from '../webhooks/flownote';
import { transform } from '../kernels/transformer';

const namespace = process.env.NAMESPACE || 'hasbrain';
const clients = {};

export const initClient = () => {
  const backend = new Request(Request.config.getInCluster());
  const client = new Client({ backend, version: '1.13' });

  const clientApiV1 = client.api.v1.namespaces(namespace);
  const clientApiV1Watch = client.api.v1.watch.namespaces(namespace);
  const clientApisExtensionsV1Beta1 = client.apis.extensions.v1beta1.namespaces(namespace);
  const clientApisAppsV1Beta1 = client.apis.apps.v1beta1.namespaces(namespace);

  // TODO: Must match manifest version
  clients.pods = clientApiV1.pods;
  clients.services = clientApiV1.services;
  clients.ingresses = clientApisExtensionsV1Beta1.ingresses;
  clients.deployments = clientApisAppsV1Beta1.deployments;
  clients.secrets = clientApiV1.secrets;
  clients.watch = clientApiV1Watch;
};

const defaultStopPhases = ['DELETED', 'FAILED', 'SUCCEEDED', 'UNKNOWN'];

export const watchKernel = (podName, { onData, shouldDestroy }) => clients.watch.pods(podName)
  .getObjectStream()
  .then(stream => new Promise((resolve, reject) => {
    let resolved = false;
    stream.on('data', ({ type, object }) => {
      if (!resolved) {
        resolved = true;
        resolve(stream);
      }

      const kernel = transform({ ...object, type });
      if (shouldDestroy && shouldDestroy(kernel)) stream.destroy();
      onData(kernel);
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

      return watchKernel(podName, {
        onData: updateKernelStatus,
        shouldDestroy: ({ phase }) => defaultStopPhases.includes(phase),
      })
        .then(() => ({ ...transform(kernel.pod), phase: 'PENDING' }));
    },
  };

  return rollbackWaterFall([
    startKernel,
    startService,
    startIngress,
    watchStatus,
  ]);
};

export const deleteKernel = (podName, options = {}) => {
  if (!podName) return Promise.reject(new Error('Missing Pod Name'));
  const { serviceName, ingressName } = options;

  return clients.pods(podName).delete()
    .then(() => Promise.all([
      clients.services(serviceName || podName).delete().catch(console.log),
      clients.ingresses(ingressName || podName).delete().catch(console.log),
    ]));
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

export const refreshDeployment = (name) => {
  const updatedAt = Date.now().toString();
  const body = {
    spec: {
      template: {
        metadata: {
          labels: { updatedAt },
        },
      },
    },
  };

  return clients.deployments(name).patch({ body });
};

export const upsertSecret = (name, body) => {
  const secretBody = buildSecret({ ...body, name });

  return clients.secrets(name).get()
    .then(() => clients.secrets(name).put({ body: secretBody }))
    .catch((err) => {
      if (!err.message.includes('not found')) return Promise.reject(err);
      return clients.secrets.post({ body: secretBody });
    });
};

export const deleteSecret = name => clients.secrets(name).delete();

export const cleanKernels = () => clients.pods.get({
  qs: { labelSelector: 'type=KERNEL' },
})
  .then((resp) => {
    const items = get('body.items')(resp) || [];
    const actions = items.reduce((rs, item) => {
      const { metadata: { name, labels } } = item;
      const shutdownTime = parseInt(get('shutdownTime')(labels), 10);
      if (shutdownTime && shutdownTime <= Date.now()) {
        rs.push(deleteKernel(name).catch(() => {}));
      }
      return rs;
    }, []);

    return Promise.all(actions);
  });

export const updateKernel = (name, fields) => {
  const allowedUpdates = ['shutdownTime'];
  const body = {
    metadata: {
      labels: flow(
        pick(allowedUpdates),
        mapValues(toString),
      )(fields),
    },
  };

  return clients.pods(name).patch({ body });
};
