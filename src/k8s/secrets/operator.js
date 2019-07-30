import { client } from '../k8s-client';
import { buildSecret } from '../manifest-builder';

export const upsertSecret = (name, body) => {
  const secretBody = buildSecret({ ...body, name });

  return client.secrets(name).get()
    .then(() => client.secrets(name).put({ body: secretBody }))
    .catch((err) => {
      if (!err.message.includes('not found')) return Promise.reject(err);
      return client.secrets.post({ body: secretBody });
    });
};

export const deleteSecret = name => client.secrets(name).delete();
