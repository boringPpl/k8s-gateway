import {
  get, isArray, isEmpty,
} from 'lodash/fp';

import { getClient } from '../k8s-client';
import { buildDaemonset } from '../manifest-builder';
import { transform } from '../kernels/decorator';

const updateDaemonset = (body) => {
  const daemonsetBody = buildDaemonset(body);
  return getClient()
    .then(client => client.daemonsets(body.name).put({
      body: daemonsetBody,
    }));
};

const watchDaemonset = name => getClient()
  .then(client => client.watch.pods.getObjectStream({
    qs: {
      labelSelector: `name=${name}`,
    },
  }));

export const deleteDaemonset = name => getClient()
  .then(client => client.daemonsets(name).delete({
    qs: {
      gracePeriodSeconds: 0,
      propagationPolicy: 'Background',
    },
  }));

const watchDaemonsetAndDeleteOnDone = name => new Promise((resolve, reject) => {
  let numReadyContainers = 0;
  let numNodes = 0;
  return getClient()
    .then(client => client.nodes.get())
    .then((resp) => {
      const nodes = get('body.items', resp);
      if (!isArray(nodes) || isEmpty(nodes)) {
        return reject(new Error('There is no nodes to watch daemonset and delete on done'));
      }
      numNodes = nodes.length;
      return watchDaemonset(name);
    })
    .then((stream) => {
      stream.on('data', ({ type, object }) => {
        const pod = transform({ ...object, type });
        if (pod.phase === 'RUNNING') {
          numReadyContainers += 1;
          if (numReadyContainers >= numNodes) {
            deleteDaemonset(name)
              .then(() => {
                console.log(`Pulled on ${numReadyContainers} nodes. Daemonset ${name} deleted`);
              })
              .catch((err) => {
                reject(err);
              })
              .finally(() => {
                stream.destroy();
                resolve(name);
              });
          }
        }
      });
      stream.on('error', (err) => {
        reject(err);
      });
    })
    .catch(err => reject(err));
});

export const createDaemonset = (body, autoDelete) => {
  const daemonsetBody = buildDaemonset(body);
  const { name } = body;

  return getClient()
    .then(client => client.daemonsets.post({
      body: daemonsetBody,
    }))
    .then((result) => {
      if (autoDelete) {
        watchDaemonsetAndDeleteOnDone(name)
          .catch((err) => {
            console.log(`watchDaemonsetAndDeleteOnDone failed with error: ${err}`);
          });
      }
      return result;
    })
    .catch((err) => {
      if (err.statusCode === 409) {
      // conflict -> update
        return updateDaemonset(body);
      }
      return Promise.reject(err);
    });
};
