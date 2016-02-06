import r from 'rethinkdb';

import config from '../../config';
import { log } from '../../shared/utils/logger';
import definitions from '../../shared/models/definitions';

const { db } = config.rethinkdb;

// Only promisers (fn that returns a promise)

export function openConnection(options={}) {
  
  return r.connect(options).then(connection => {
    log('Connected correctly to RethinkDB');
    return connection;
  });
}

export function closeConnection(connection) {
  
  return connection.close().then(() => {
    log('Disconnected correctly from RethinkDB');
    return connection;
  });
}

export function createDatabase(connection) {
  log('Creating database', db);
  
  return r.dbList().run(connection)
  .then(result => result.includes(db) ? connection : r.dbCreate(db).run(connection).then(() => connection));
}

// Will create the tables (unless already existant?)
export function createTables(connection) {
  
  return r.db(db).tableList().run(connection).then(tableList => {
    let promises = [];
    for (let model in definitions) {
      const { pluralName } = definitions[model];
      
      if (!tableList.includes(pluralName)) {
        log('Creating table', pluralName);
        promises.push(r.tableCreate(pluralName).run(connection));
      }
    }
    
    return Promise.all(promises).then(() => connection);
  });
}


export function dropDatabase(connection) {
  log('Dropping database', db);
  
  return r.dbDrop(db).run(connection).then(() => connection);
}
