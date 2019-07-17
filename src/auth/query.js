import { get } from 'lodash/fp';

import { addSelector } from '../k8s/selector';

export const buildAuthQuery = (req) => {
  const role = get('user.role')(req);
  const profileId = get('user.profileId')(req);

  if (role === 'ADMIN') return req.query;

  return addSelector({ labels: `profileId=${profileId}` })(req.query);
};
