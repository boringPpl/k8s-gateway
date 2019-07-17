import { assign } from 'lodash/fp';

export const addSelector = selectors => (query) => {
  const adds = Object.keys(selectors).reduce((rs, key) => {
    const initVals = (query[key] && query[key].split(',')) || [];
    return assign(rs)({ [key]: initVals.concat([selectors[key]]).join(',') });
  }, {});

  return assign(query)(adds);
};
