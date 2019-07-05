// Caution: This function modify root argument
// exec func should resolve object {}
import { clone, pick } from 'lodash/fp';

const rollbackWaterFall = (
  actions = [], rollbacks = [], root = {},
) => {
  const tmpRollbacks = clone(rollbacks);

  return actions.reduce(
    (waterfall, { pickAttr = [], exec, rollback }, step) => {
      const flow = (droplet = {}) => {
        const attrs = pick(pickAttr)(droplet);
        Object.assign(root, { ...attrs, step: step + 1 });
        if (rollback) tmpRollbacks.push(rollback);
        return exec(root);
      };

      const stop = (error) => {
        if (tmpRollbacks.length === 0) return Promise.reject(error);

        Object.assign(root, { error });
        if (rollback) tmpRollbacks.pop();

        return tmpRollbacks.reduce(
          (rs, rb) => rs.then(() => rb(root)).catch(console.log),
          Promise.resolve(),
        )
          .then(() => {
            tmpRollbacks.length = 0;
            return Promise.reject(error);
          });
      };

      return waterfall.then(flow).catch(stop);
    },
    Promise.resolve(root),
  );
};

export default rollbackWaterFall;
