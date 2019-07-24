import {
  flow, pick, mapValues, get, toString,
} from 'lodash/fp';

import { client } from '../k8s-client';
import { buildCronjob } from '../manifest-builder';
import { transform } from './transformer';

export const createCronjob = (options) => {
  const cronjob = buildCronjob(options);

  return client.cronjobs.post({ body: cronjob })
    .then(({ body }) => transform(body));
};

export const deleteCronjob = name => client.cronjobs(name).delete();

export const updateCronjob = (name, fields) => {
  const allowedLabels = ['shutdownTime', 'suspend'];
  const allowedSpecs = ['suspend'];
  const updates = {
    metadata: {
      labels: flow(
        pick(allowedLabels),
        mapValues(toString),
      )(fields),
    },
    spec: pick(allowedSpecs)(fields),
  };

  return client.cronjobs(name).patch({ body: updates })
    .then(({ body }) => transform(body));
};

export const getCronjobs = ({
  fields = '', labels = '', limit = 100,
}) => client.cronjobs.get({
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

export const cleanCronjobs = () => client.cronjobs.get({
  qs: { labelSelector: 'suspend!=true', limit: 100 },
})
  .then((resp) => {
    const items = get('body.items')(resp) || [];
    const now = Date.now();
    const actions = items.reduce((rs, item) => {
      const { metadata: { name, labels } } = item;
      const shutdownTime = parseInt(get('shutdownTime')(labels), 10);

      if (shutdownTime && shutdownTime <= now) {
        rs.push(updateCronjob(name, { suspend: true }).catch(() => {}));
      }
      return rs;
    }, []);

    return Promise.all(actions);
  });
