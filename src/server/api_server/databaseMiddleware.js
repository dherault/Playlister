import builders from './queryBuilders';
import { logFetch, log } from '../../shared/utils/logger';

let connection;

// This is horrible
export function initMiddleware(dbConnection) {
  log('Initializing db middleware');
  connection = dbConnection;
  return dbConnection;
}

// Resolves data based on intention and params
export default function queryDatabase(intention, params) {
  
  logFetch('-->', intention, params);
  if (!connection) return Promise.reject('No database connection');
  
  const d = new Date();
  const builder = builders[intention];
  
  // Calling a builder returns a query promise
  if (typeof builder === 'function') {
    
    const query = builder(connection, params).then(result => {
      logFetch(`<-- ${intention} after ${new Date() - d}ms`);
      logFetch(result);
      return result;
    });
    
    // query.catch(err => console.error(err));
    
    return query;
  }
  else return Promise.reject(`No query builder found for your intention: ${intention}`);
}
