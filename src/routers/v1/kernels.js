import express from 'express';
import { flow, set } from 'lodash/fp';

import k8sClient from '../../k8s/client';
import { mustHave } from '../../auth/middlewares';
import { buildAuthQuery } from '../../auth/query';
import { writeSSEHeaders, sendSSEJSONData } from '../../utils/sse';
import { addSelector } from '../../k8s/selector';

const router = express.Router();
router.post('/', mustHave('CREATE'));

router.post('/', (req, res) => {
  const body = set('pod.metadata.labels.profileId', req.user.profileId)(req.body);

  k8sClient.createKernel(body)
    .then(rs => res.json(rs))
    .catch(err => res.status(422).json({ message: err.message }));
});

router.patch('/:name', (req, res) => {
  k8sClient.getKernel(req.params.name)
    .then((kernel) => {
      if (kernel.profileId !== req.user.profileId) throw new Error('Forbidden');
      return k8sClient.updateKernel(req.params.name, req.body);
    })
    .then(rs => res.json(rs))
    .catch(err => res.status(422).json({ message: err.message }));
});

router.delete('/:name', (req, res) => {
  k8sClient.getKernel(req.params.name)
    .then((kernel) => {
      if (kernel.profileId !== req.user.profileId) throw new Error('Forbidden');
      return k8sClient.deleteKernel(req.params.name, req.body);
    })
    .then(rs => res.json(rs))
    .catch(err => res.status(422).json({ message: err.message }));
});

router.get('/:name/watch', (req, res) => {
  writeSSEHeaders(res);

  k8sClient.watchKernel(req.params.name, {
    onData: sendSSEJSONData(res),
  })
    .then(stream => req.on('close', () => stream.destroy()))
    .catch((err) => {
      console.log(err);
      res.end();
    });
});

router.get('/watch', (req, res) => {
  writeSSEHeaders(res);

  const query = flow(
    buildAuthQuery,
    addSelector({ labels: 'type=KERNEL' }),
  )(req);

  k8sClient.watchKernels({
    ...query,
    onData: sendSSEJSONData(res),
  })
    .then(stream => req.on('close', () => stream.destroy()))
    .catch((err) => {
      console.log(err);
      res.end();
    });
});

router.get('/:name', (req, res) => {
  k8sClient.getKernel(req.params.name)
    .then(rs => res.json(rs))
    .catch(err => res.status(404).json({ message: err.message }));
});

router.get('/', (req, res) => {
  const query = flow(
    buildAuthQuery,
    addSelector({ labels: 'type=KERNEL' }),
  )(req);

  k8sClient.getKernels(query)
    .then(rs => res.json(rs))
    .catch(err => res.status(404).json({ message: err.message }));
});

export default router;
