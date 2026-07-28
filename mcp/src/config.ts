/** REST API origin. Override for remote deployments. */
export const getApiUrl = (): string => {
  return (process.env.ISOFLOW_API_URL ?? 'http://localhost:9324').replace(
    /\/$/,
    ''
  );
};

/** Web app origin used for Playwright navigation. Override for remote deployments. */
export const getAppUrl = (): string => {
  return (process.env.ISOFLOW_APP_URL ?? 'http://localhost:9323').replace(
    /\/$/,
    ''
  );
};
