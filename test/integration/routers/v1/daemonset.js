import { requester, expect } from '../../../utils/chai-tools';
import { getMessage } from '../../../utils/error-response';

describe('V1', () => {
  describe('Daemonset', () => {
    const daemonsetName = 'daemonset-name';
    const imagePath = 'docker.io/image1';
    const containerCommand = 'echo "hello"';
    // FIXME: `Delete` are bound to `Create`.
    // Do not try to run it separately
    describe('Create', () => {
      it('Create WITH secret', (done) => {
        const secretName = 'secret-name';
        requester.post('/v1/daemonsets')
          .send({
            name: daemonsetName,
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
        requester.post('/v1/daemonsets')
          .send({
            name: daemonsetName,
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
    });

    describe('Delete', () => {
      it('delete', (done) => {
        requester.delete(`/v1/daemonsets/${daemonsetName}`)
          .then((res) => {
            expect(res, getMessage(res)).to.have.status(200);
            done();
          })
          .catch(done);
      });
    });
  });
});
