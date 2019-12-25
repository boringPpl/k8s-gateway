import { getClient } from '../k8s-client';
import { buildSecret } from '../manifest-builder';

export const upsertSecret = (name, body) => {
  const secretBody = buildSecret({ ...body, name });
  let client;

  return getClient()
    .then((c) => {
      client = c;
      return client.secrets(name).get();
    })
    .then(() => client.secrets(name).put({ body: secretBody }))
    .catch((err) => {
      if (!err.message.includes('not found')) return Promise.reject(err);
      return client.secrets.post({ body: secretBody });
    });
};

export const deleteSecret = name => getClient()
  .then(client => client.secrets(name).delete());

export const checkSecretExistence = name => getClient()
  .then(client => client.secrets(name).get())
  .then(() => true)
  .catch(() => false);
