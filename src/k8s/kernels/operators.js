import {
  get, assign, flow, pick, toString, mapValues,
} from 'lodash/fp';

import { client } from '../k8s-client';
import { build } from '../manifest-builder';
import rollbackWaterFall from '../../utils/rollback-waterfall';
import { updateKernelStatus } from '../../webhooks/flownote';
import { transform } from './transformer';

const defaultStopPhases = ['DELETED', 'FAILED', 'SUCCEEDED', 'UNKNOWN'];

export const watchKernel = (podName, { onData, shouldDestroy }) => client.watch
  .pods(podName)
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

export const createKernel = ({
  pod, service, ingress, watch,
}) => {
  if (!pod) return Promise.reject(new Error('Missing Pod'));

  const startKernel = {
    exec: (kernel) => {
      Object.assign(kernel, build({ pod }));
      return client.pods.post({ body: kernel.pod });
    },
    rollback: (kernel) => {
      const podName = get('pod.metadata.name')(kernel);
      return client.pods(podName).delete();
    },
  };

  const startService = {
    exec: (kernel) => {
      if (!service) return Promise.resolve();
      Object.assign(kernel, build({ service: assign(service)(kernel) }));
      return client.services.post({ body: kernel.service });
    },
    rollback: (kernel) => {
      if (!service) return Promise.resolve();
      const serviceName = get('service.metadata.name')(kernel);
      return client.services(serviceName).delete();
    },
  };

  const startIngress = {
    exec: (kernel) => {
      if (!ingress) return Promise.resolve(kernel);
      Object.assign(kernel, build({ ingress: assign(ingress)(kernel) }));
      return client.ingresses.post({ body: kernel.ingress }).then(() => kernel);
    },
    rollback: (kernel) => {
      if (!ingress) return Promise.resolve();
      const ingressName = get('ingress.metadata.name')(kernel);
      return client.ingresses(ingressName).delete();
    },
  };

  const watchStatus = {
    exec: (kernel) => {
      const output = { ...transform(kernel.pod), phase: 'PENDING' };
      if (!watch) return output;

      const podName = get('pod.metadata.name')(kernel);

      return watchKernel(podName, {
        onData: updateKernelStatus,
        shouldDestroy: ({ phase }) => defaultStopPhases.includes(phase),
      })
        .then(() => output);
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

  return client.pods(podName).delete()
    .then(() => Promise.all([
      client.services(serviceName || podName).delete().catch(console.log),
      client.ingresses(ingressName || podName).delete().catch(console.log),
    ]));
};

export const getKernel = (podName) => {
  if (!podName) return Promise.reject(new Error('Missing Pod Name'));

  return client.pods(podName).get()
    .then(({ body }) => transform(body));
};

export const getKernels = ({
  fields = '', labels = '', limit = 100,
}) => client.pods.get({
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

export const cleanKernels = () => client.pods.get({
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

  return client.pods(name).patch({ body });
};

export const watchKernels = (options) => {
  const {
    fields, labels, onData, shouldDestroy,
  } = options;

  return client.watch
    .pods
    .getObjectStream({
      qs: {
        fieldSelector: fields,
        labelSelector: labels,
      },
    })
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
};
