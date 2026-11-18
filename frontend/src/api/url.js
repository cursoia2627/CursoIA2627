const configuredBase=(process.env.REACT_APP_API_URL||'http://localhost:4000').replace(/\/+$/,'');
export const API_BASE=/\/api$/i.test(configuredBase)?configuredBase:configuredBase+'/api';
export const API_ROOT=API_BASE.replace(/\/api$/i,'');
