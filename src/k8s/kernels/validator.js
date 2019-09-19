export const validateUpdates = (oldRecord, newRecord) => {
  const { shutdownTime } = newRecord;

  if (shutdownTime) {
    const { startTime } = oldRecord;
    const maxSessionTime = 7 * 86400 * 1000;

    if (!startTime) throw new Error('Missing startTime');
    if (shutdownTime - startTime > maxSessionTime) throw new Error('Reach maximum usage time');
  }
};
