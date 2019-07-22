import express from 'express';

import { getClient } from '../../k8s/client';
import { allow } from '../../auth/middlewares';

const router = express.Router();
const k8sClient = getClient();

router.use(allow(['ADMIN']));

router.post('/', (req, res) => {
  const autoDelete = req.query.autoDelete === 'true';
  k8sClient.createDaemonset(req.body, autoDelete)
    .then(rs => res.json(rs))
    .catch(err => res.status(422).json({ message: err.message }));
});

router.delete('/:name', (req, res) => {
  k8sClient.deleteDaemonset(req.params.name)
    .then(rs => res.json(rs))
    .catch(err => res.status(422).json({ message: err.message }));
});

export default router;
