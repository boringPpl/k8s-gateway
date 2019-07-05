import express from 'express';

import { getClient } from '../../k8s/client';

const router = express.Router();
const k8sClient = getClient();

router.post('/', (req, res) => {
  k8sClient.createKernel(req.body)
    .then(rs => res.json(rs))
    .catch(err => res.status(422).json({ message: err.message }));
});

router.delete('/:name', (req, res) => {
  k8sClient.deleteKernel(req.params.name, req.body)
    .then(rs => res.json(rs))
    .catch(err => res.status(422).json({ message: err.message }));
});

router.get('/:name', (req, res) => {
  k8sClient.getKernel(req.params.name)
    .then(rs => res.json(rs))
    .catch(err => res.status(404).json({ message: err.message }));
});

router.get('/', (req, res) => {
  k8sClient.getKernels(req.query)
    .then(rs => res.json(rs))
    .catch(err => res.status(404).json({ message: err.message }));
});

export default router;
