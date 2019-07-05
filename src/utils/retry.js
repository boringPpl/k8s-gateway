const defaultUnit = process.env.NODE_ENV === 'test' ? 1 : 1000;

const retry = ({
  retries = 3, attempt = 1, delay = 3, unitToMs = defaultUnit,
}) => ({ exec, checkError = () => false }) => {
  const execRetry = () => {
    const nextDelay = (delay ** attempt) * unitToMs;
    setTimeout(() => {
      const retryOpts = {
        retries, attempt: attempt + 1, delay, unitToMs,
      };

      retry(retryOpts)({ exec, checkError }).catch(() => {});
    }, nextDelay);
  };

  return Promise.resolve('OK')
    .then(() => exec())
    .then((rs) => {
      if (checkError(rs) && attempt <= retries) execRetry();
      return rs;
    })
    .catch((err) => {
      if (attempt <= retries) execRetry();
      return Promise.reject(err);
    });
};

export default retry;
