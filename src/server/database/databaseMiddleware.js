import builders from './queryBuilders';
import log from '../../shared/utils/logger';

let db;

// Passes de mongoclient object to the query builders
// This is horrible
export function initMiddleware(dbConnection) {
  // console.log('initializing db middleware');
  db = dbConnection;
}

// Resolves data based on intention and params
export default function queryDatabase(intention, params) {
  
  log('... queryDatabase', intention, params);
  if (!db) return Promise.reject('No database connection');
  
  const d = new Date();
  const builder = builders[intention];
  
  // Calling a builder returns a query promise
  if (typeof builder === 'function') {
    
    const query = builder(db, params).then(result => {
      log(`+++ <-- ${intention} after ${new Date() - d}ms`);
      log('+++', result);
      return result;
    });
    
    query.catch(err => console.error(err));
    
    return query;
  }
  else return Promise.reject(`No query builder found for your intention: ${intention}`);
}
