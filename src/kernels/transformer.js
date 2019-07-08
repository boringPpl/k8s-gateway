import {
  flow, get, pick, find, isMatch, isEqual, some, every,
} from 'lodash/fp';

const podCondition = type => flow(
  get('conditions'),
  find(isMatch({ type })),
);

const podScheduled = flow(
  podCondition('PodScheduled'),
  get('status'),
  isEqual('True'),
);

const podScheduledMessage = flow(
  podCondition('PodScheduled'),
  get('message'),
);

const imagePulled = flow(
  get('containerStatuses'),
  every(s => s.imageID),
);

const containersReady = flow(
  podCondition('ContainersReady'),
  get('status'),
  isEqual('True'),
);

const containersReadyMessage = flow(
  podCondition('ContainersReady'),
  get('message'),
);

const containerTerminated = flow(
  get('containerStatuses'),
  some(
    flow(
      get('state.terminated.exitCode'),
      isEqual(0),
    ),
  ),
);

const outOfResourcesPhase = (status) => {
  const portCollisionMessage = 'free ports for the requested pod ports';
  const message = podScheduledMessage(status);
  const phase = message.includes(portCollisionMessage) ? 'PORT_COLLISION' : 'OUT_OF_RESOURCES';
  return { phase, message };
};

export const statusToPhase = ({ type, status }) => {
  if (type === 'DELETED') return { phase: 'DELETED' };
  if (containerTerminated(status)) return { phase: 'DELETED' };

  const phase = get('phase')(status);

  switch (phase) {
    case 'Pending':
      if (!podScheduled(status)) return outOfResourcesPhase(status);
      if (!imagePulled(status)) return { phase: 'PULLING_IMAGE' };
      if (!containersReady(status)) return { phase: 'STARTING_CONTAINER', message: containersReadyMessage(status) };
      return { phase: 'EXPOSING' };
    case 'Running':
      if (!containersReady(status)) return { phase: 'CONTAINER_ERROR', message: containersReadyMessage(status) };
      return { phase: 'RUNNING' };
    case 'Failed':
    case 'Succeeded':
      return { phase: phase.toUpperCase() };
    default:
      return { phase: 'UNKNOWN' };
  }
};

export const getMetadata = flow(
  get('metadata'),
  pick(['name', 'labels']),
);

export const transform = kernel => ({
  name: get('metadata.name')(kernel),
  notebookPath: get('metadata.labels.notebookPath')(kernel),
  ...statusToPhase(kernel),
  metadata: getMetadata(kernel),
});
