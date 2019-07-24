import Request from 'kubernetes-client/backends/request';
import { Client } from 'kubernetes-client';

const namespace = process.env.NAMESPACE || 'hasbrain';
export const client = {};

export const initK8sClient = () => {
  const backend = new Request(Request.config.getInCluster());
  const inClusterClient = new Client({ backend, version: '1.13' });

  const clientApiV1 = inClusterClient.api.v1;
  const clientApiV1Namespace = clientApiV1.namespaces(namespace);
  const clientApiV1Watch = clientApiV1.watch.namespaces(namespace);
  const clientApisExtensionsV1Beta1 = inClusterClient.apis.extensions.v1beta1.namespaces(namespace);
  const clientApisAppsV1Beta1 = inClusterClient.apis.apps.v1beta1.namespaces(namespace);
  const clientApisAppsV1Beta2 = inClusterClient.apis.apps.v1beta2.namespaces(namespace);
  const clientApisBatchV1Beta1 = inClusterClient.apis.batch.v1beta1.namespaces(namespace);

  // TODO: Must match ma nifest version
  client.pods = clientApiV1Namespace.pods;
  client.services = clientApiV1Namespace.services;
  client.ingresses = clientApisExtensionsV1Beta1.ingresses;
  client.deployments = clientApisAppsV1Beta1.deployments;
  client.secrets = clientApiV1Namespace.secrets;
  client.watch = clientApiV1Watch;
  client.daemonsets = clientApisAppsV1Beta2.daemonsets;
  client.nodes = clientApiV1.nodes;
  client.cronjobs = clientApisBatchV1Beta1.cronjobs;

  return client;
};
