import Request from 'kubernetes-client/backends/request';
import { Client } from 'kubernetes-client';

const namespace = process.env.NAMESPACE || 'hasbrain';
let client = null;

export const initK8sClient = () => {
  const backend = new Request(Request.config.getInCluster());
  const inClusterClient = new Client({ backend });

  return inClusterClient.loadSpec()
    .then(() => {
      const clientApiV1 = inClusterClient.api.v1;
      const clientApiV1Namespace = clientApiV1.namespaces(namespace);
      const clientApiV1Watch = clientApiV1.watch.namespaces(namespace);
      const clientApisExtensionsV1Beta1 = inClusterClient
        .apis.extensions.v1beta1.namespaces(namespace);
      const clientApisBatchV1Beta1 = inClusterClient.apis.batch.v1beta1.namespaces(namespace);
      const clientApisAppsV1 = inClusterClient.apis.apps.v1.namespaces(namespace);

      // TODO: Must match manifest version
      client = {
        pods: clientApiV1Namespace.pods,
        services: clientApiV1Namespace.services,
        ingresses: clientApisExtensionsV1Beta1.ingresses,
        deployments: clientApisAppsV1.deployments,
        secrets: clientApiV1Namespace.secrets,
        watch: clientApiV1Watch,
        daemonsets: clientApisAppsV1.daemonsets,
        nodes: clientApiV1.nodes,
        cronjobs: clientApisBatchV1Beta1.cronjobs,
        events: clientApiV1Namespace.events,
      };

      return client;
    });
};

export const getClient = () => {
  if (client) return Promise.resolve(client);
  return initK8sClient();
};
