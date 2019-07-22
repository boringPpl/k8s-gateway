import { requester, expect } from '../../../utils/chai-tools';
import { getMessage } from '../../../utils/error-response';
import { generateToken } from '../../../utils/token';

describe('V1', () => {
  describe('Daemonset', () => {
    const daemonsetName = 'daemonset-name';
    const imagePath = 'docker.io/minhhien1996/image1';
    const containerCommand = 'echo SUCCESS';
    // FIXME: `Delete` are bound to `Create`.
    // Do not try to run it separately
    describe('Create', () => {
      it('Create WITH secret', (done) => {
        const secretName = 'secret-name';
        requester.post('/v1/daemonsets?autoDelete=true')
          .set('X-Auth-Token', generateToken({ role: 'ADMIN' }))
          .send({
            name: `${daemonsetName}-secret`,
            secretName,
            imagePath,
            containerCommand,
          })
          .then((res) => {
            expect(res, getMessage(res)).to.have.status(200);
            expect(
              res.body.body.spec.template.spec.imagePullSecrets,
              'imagePullSecrets',
            ).to.have.lengthOf(1);
            expect(
              res.body.body.spec.template.spec.imagePullSecrets[0].name,
              'imagePullSecrets',
            ).to.be.equal(secretName);
            done();
          })
          .catch(done);
      });

      it('Create WITHOUT secret', (done) => {
        requester.post('/v1/daemonsets?autoDelete=true')
          .set('X-Auth-Token', generateToken({ role: 'ADMIN' }))
          .send({
            name: `${daemonsetName}-no-secret`,
            imagePath,
            containerCommand,
          })
          .then((res) => {
            expect(res, getMessage(res)).to.have.status(200);
            expect(
              res.body.body.spec.template.spec.imagePullSecrets,
              'imagePullSecrets',
            ).to.not.exist;
            done();
          })
          .catch(done);
      });

      it('ADMIN only', (done) => {
        requester.post('/v1/daemonsets')
          .then((res) => {
            expect(res, getMessage(res)).to.have.status(403);
            done();
          })
          .catch(done);
      });
    });

    describe('Delete', () => {
      const name = `${daemonsetName}-delete`;
      it('delete', (done) => {
        requester.post('/v1/daemonsets')
          .set('X-Auth-Token', generateToken({ role: 'ADMIN' }))
          .send({
            name,
            imagePath,
            containerCommand,
          })
          .then(() => requester
            .delete(`/v1/daemonsets/${name}`)
            .set('X-Auth-Token', generateToken({ role: 'ADMIN' })))
          .then((res) => {
            expect(res, getMessage(res)).to.have.status(200);
            done();
          })
          .catch(done);
      });

      it('ADMIN only', (done) => {
        requester.delete(`/v1/daemonsets/${daemonsetName}`)
          .then((res) => {
            expect(res, getMessage(res)).to.have.status(403);
            done();
          })
          .catch(done);
      });
    });
  });
});
