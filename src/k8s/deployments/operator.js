import { getClient } from '../k8s-client';

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

  return getClient().then(client => client.deployments(name).patch({ body }));
};
