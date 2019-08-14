import {
  get,
  set,
  flow,
  assign,
  concat,
  filter,
  pick,
  isNil,
  omit,
} from 'lodash/fp';
import crypto from 'crypto';

import defaultPod from '../manifests/pod.json';
import defaultContainer from '../manifests/container.json';
import defaultService from '../manifests/service.json';
import defaultIngress from '../manifests/ingress.json';
import defaultSecret from '../manifests/secret.json';
import defaultDaemonset from '../manifests/daemonset.json';
import defaultCronjob from '../manifests/cronjob.json';

const defaultPort = {
  protocol: 'TCP',
  targetPort: 8888,
};

const defaultNotebookArgs = [
  '--NotebookApp.allow_origin=*',
  '--NotebookApp.disable_check_xsrf=True',
];

const generateToken = () => crypto.randomBytes(16).toString('hex');

const unsafeKeys = ['serviceAccount', 'serviceAccountName', 'securityContext'];
const enforceSecurity = omit(unsafeKeys);

export const buildPod = ({ metadata, container, spec }) => {
  const defaultLabels = get('metadata.labels')(defaultPod);
  const labels = assign(defaultLabels, get('labels')(metadata));
  if (!labels.token) labels.token = generateToken();

  const notebookArgs = flow(
    get('args'),
    concat(defaultNotebookArgs),
    concat([`--NotebookApp.token=${labels.token}`]),
    filter(i => i),
  )(container);

  const containers = flow(
    assign(container),
    assign(defaultContainer),
    concat([]),
  )({ args: notebookArgs });

  const newSpec = flow(
    assign({ containers }),
    enforceSecurity,
  )(spec);

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
  const selector = flow(
    get('metadata.labels'),
    pick(['notebookPath']),
  )(pod);
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

const ingressOption = (type, serviceName) => {
  switch (type) {
    case 'nginx':
      return {
        annotations: {
          'nginx.ingress.kubernetes.io/rewrite-target': '/$2',
          'kubernetes.io/ingress.class': 'nginx',
        },
        path: `/${serviceName}(/|$)(.*)`,
      };
    // haproxy
    default:
      return {
        annotations: {
          'ingress.kubernetes.io/rewrite-target': '/',
          'kubernetes.io/ingress.class': 'haproxy',
        },
        path: `/${serviceName}`,
      };
  }
};

export const buildIngress = ({
  metadata, host, ingressType, spec, service,
}) => {
  const serviceName = get('metadata.name')(service);
  const ingressMetadata = assign({ name: serviceName, annotations: {} })(metadata);
  const ruleExists = get('rules')(spec);
  const { annotations, path } = ingressOption(ingressType, serviceName);
  if (!ruleExists) Object.assign(ingressMetadata.annotations, annotations);

  const servicePort = get('spec.ports[0].port')(service);
  const rule = {
    host,
    http: {
      paths: [{
        path,
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

export const buildDaemonset = ({
  name,
  imagePath,
  secretName,
  containerCommand = 'echo SUCCESS',
}) => {
  const execCommandThenSleep = `${containerCommand} && sleep infinity`;
  const command = [
    '/bin/sh',
    '-c',
    execCommandThenSleep,
  ];
  const imagePullSecrets = isNil(secretName) ? undefined : [{
    name: secretName,
  }];
  return flow(
    set('metadata.name', name),
    set('spec.template.spec.containers.0.name', name),
    set('spec.template.spec.containers.0.image', imagePath),
    set('spec.template.spec.containers.0.command', command),
    set('spec.template.spec.imagePullSecrets', imagePullSecrets),
    set('spec.selector.matchLabels.name', name),
    set('spec.template.metadata.labels.name', name),
  )(defaultDaemonset);
};

export const buildCronjob = ({
  metadata, schedule, container, spec,
}) => {
  if (!container) throw new Error('Missing Cronjob Container');

  const defaultCronjobContainer = pick(['name', 'image', 'imagePullPolicy'])(defaultContainer);
  const newContainer = assign(defaultCronjobContainer)(container);
  const newSpec = flow(
    assign({ containers: [newContainer], restartPolicy: 'OnFailure' }),
    enforceSecurity,
  )(spec);

  return flow(
    set('metadata', metadata),
    set('spec.schedule', schedule),
    set('spec.jobTemplate.spec.template.spec', newSpec),
  )(defaultCronjob);
};
