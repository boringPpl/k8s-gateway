import { get } from 'lodash/fp';
import { getShutdownTime } from '../kernels/transformer';

export const transform = cronjob => ({
  profileId: get('metadata.labels.profileId')(cronjob),
  name: get('metadata.name')(cronjob),
  suspend: get('spec.suspend')(cronjob) || false,
  schedule: get('spec.schedule')(cronjob),
  notebook: get('metadata.labels.notebook')(cronjob),
  shutdownTime: getShutdownTime(cronjob),
  active: get('status.active.length')(cronjob) || 0,
  lastSchedule: get('status.lastScheduleTime')(cronjob),
});
