import express from 'express';
import { flow, set } from 'lodash/fp';

import k8sClient from '../../k8s/client';
import { buildAuthQuery } from '../../auth/query';

const router = express.Router();

router.get('/', (req, res) => {
  const query = buildAuthQuery(req);

  k8sClient.getCronjobs(query)
    .then(rs => res.json(rs))
    .catch(err => res.status(404).json({ message: err.message }));
});

router.post('/', (req, res) => {
  const body = flow(
    set('metadata.labels.workspaceId', req.user.workspaceId),
    set('metadata.labels.profileId', req.user.profileId),
  )(req.body);

  k8sClient.createCronjob(body)
    .then(rs => res.json(rs))
    .catch(err => res.status(422).json({ message: err.message }));
});

router.delete('/:name', (req, res) => {
  k8sClient.deleteCronjob(req.params.name)
    .then(rs => res.json(rs))
    .catch(err => res.status(422).json({ message: err.message }));
});

router.patch('/:name', (req, res) => {
  k8sClient.updateCronjob(req.params.name, req.body)
    .then(rs => res.json(rs))
    .catch(err => res.status(422).json({ message: err.message }));
});

export default router;
