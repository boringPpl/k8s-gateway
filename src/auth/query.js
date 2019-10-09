import { get } from 'lodash/fp';

import { addSelector } from '../k8s/selector';

export const buildAuthQuery = (req) => {
  const role = get('user.role')(req);
  const profileId = get('user.profileId')(req);
  const workspaceId = get('user.workspaceId')(req);

  if (role === 'ADMIN' && req.query.all) return req.query;

  return addSelector({ labels: `workspaceId=${workspaceId},profileId=${profileId}` })(req.query);
};
