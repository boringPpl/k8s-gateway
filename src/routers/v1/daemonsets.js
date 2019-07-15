import express from 'express';
import { getClient } from '../../k8s/client';

const router = express.Router();
const k8sClient = getClient();

router.post('/', (req, res) => {
  k8sClient.createDaemonset(req.body)
    .then(rs => res.json(rs))
    .catch(err => res.status(422).json({ message: err.message }));
});

router.delete('/:name', (req, res) => {
  k8sClient.deleteDaemonset(req.params.name)
    .then(rs => res.json(rs))
    .catch(err => res.status(422).json({ message: err.message }));
});

export default router;
