import getBuilders from './queryBuilders';
import log from '../../utils/logger';

let builders = [];

// Passes de mongoclient object to the query builders
export function initMiddleware(dbConnection) {
  builders = getBuilders(dbConnection);
}

// Resolves data based on intention and params
export default function queryDatabase(intention, params) {
  const d = new Date();
  const buildQuery = builders[intention];
  
  // log('queryDatabase', intention, params)
  
  if (buildQuery) {
    const query = buildQuery(params);
    query.then(result => {
      log(`+++ <-- ${intention} after ${new Date() - d}ms`);
      log('+++', result);
    });
    
    return query; // A promise resolving the data
  }
  else return Promise.reject(`No query builder found for your intention: ${intention}`);
}
