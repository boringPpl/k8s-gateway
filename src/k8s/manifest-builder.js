import {
  get, set, flow, assign, concat, filter,
} from 'lodash/fp';

import defaultPod from '../manifests/pod.json';
import defaultContainer from '../manifests/container.json';
import defaultService from '../manifests/service.json';
import defaultIngress from '../manifests/ingress.json';
import defaultSecret from '../manifests/secret.json';

const defaultPort = {
  protocol: 'TCP',
  targetPort: 8888,
};

const defaultNotebookArgs = [
  '--NotebookApp.token=',
  '--NotebookApp.allow_origin=*',
  '--NotebookApp.disable_check_xsrf=True',
];

export const buildPod = ({ metadata, container, spec }) => {
  const labels = assign(
    get('metadata.labels')(defaultPod),
    get('labels')(metadata),
  );

  const notebookArgs = flow(
    concat(defaultNotebookArgs),
    filter(i => i),
  )(container.args);

  const containers = flow(
    assign(container),
    assign(defaultContainer),
    concat([]),
  )({ args: notebookArgs });

  const newSpec = assign({ containers })(spec);

  return flow(
    set('metadata', assign(defaultPod.metadata)(metadata)),
    set('metadata.labels', labels),
    set('spec', assign(defaultPod.spec)(newSpec)),
  )(defaultPod);
};

export const buildService = ({
  metadata, port, spec, pod,
}) => {
  const svcMetadata = assign({ name: get('metadata.name')(pod) })(metadata);
  const selector = get('metadata.labels')(pod);
  const targetPort = get('spec.containers[0].ports[0].containerPort')(pod);
  const ports = flow(
    assign({ targetPort }),
    assign(defaultPort),
    concat([]),
  )(port);

  const svcSpec = assign({ selector, ports })(spec);

  return flow(
    set('metadata', assign(defaultService.metadata)(svcMetadata)),
    set('spec', assign(defaultService.spec)(svcSpec)),
  )(defaultService);
};

export const buildIngress = ({
  metadata, host, spec, service,
}) => {
  const serviceName = get('metadata.name')(service);
  const ingressMetadata = assign({ name: serviceName, annotations: {} })(metadata);
  const ruleExists = get('rules')(spec);
  if (!ruleExists) {
    const rewriteTarget = 'nginx.ingress.kubernetes.io/rewrite-target';
    ingressMetadata.annotations[rewriteTarget] = '/$2';
  }

  const servicePort = get('spec.ports[0].port')(service);
  const rule = {
    host,
    http: {
      paths: [{
        path: `/${serviceName}(/|$)(.*)`,
        backend: { serviceName, servicePort },
      }],
    },
  };
  const ingressSpec = assign({ rules: [rule] })(spec);

  return flow(
    set('metadata', assign(defaultIngress.metadata)(ingressMetadata)),
    set('spec', assign(defaultIngress.spec)(ingressSpec)),
  )(defaultIngress);
};

export const build = (options) => {
  const builders = {
    pod: buildPod,
    service: buildService,
    ingress: buildIngress,
  };

  return Object.keys(options).reduce((rs, key) => {
    const params = options[key];
    if (!params) return rs;

    const buildManifest = builders[key];
    const manifest = buildManifest ? buildManifest(params) : params;
    return assign(rs)({ [key]: manifest });
  }, {});
};

export const buildSecret = ({ name, data, type = 'Opaque' }) => {
  const secretMetadata = assign(defaultSecret.metadata)({ name });

  return flow(
    set('metadata', secretMetadata),
    set('data', data),
    set('type', type),
  )(defaultSecret);
};
