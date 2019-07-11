import express from 'express';

import { getClient } from '../../k8s/client';

const router = express.Router();
const k8sClient = getClient();

router.post('/', (req, res) => {
  k8sClient.createKernel(req.body)
    .then(rs => res.json(rs))
    .catch(err => res.status(422).json({ message: err.message }));
});

router.patch('/:name', (req, res) => {
  k8sClient.updateKernel(req.params.name, req.body)
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

const formatSSE = data => `data: ${data}\n\n`;

router.get('/:name/watch', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write('\n');

  k8sClient.watchKernel(req.params.name, {
    onData: (kernel) => {
      const data = formatSSE(JSON.stringify(kernel));
      res.write(data);
    },
  })
    .then(stream => req.on('close', () => stream.destroy()))
    .catch((err) => {
      console.log(err);
      res.end();
    });
});

export default router;
