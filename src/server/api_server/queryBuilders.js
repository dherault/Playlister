import r from 'rethinkdb';
import { capitalizeFirstChar } from '../../shared/utils/textUtils';
import definitions from '../../shared/models/definitions';

// Field filtering
const forbiddenKeys = ['createdAt', 'updatedAt', 'creationIp', 'passwordHash', 'creatorId', 'updaterId'];

// Utils
const toArray = cursor => cursor.toArray();
const pickFirst = cursor => cursor.toArray().then(array => array[0]);
const normalize = array => {  
  const obj = {};
  array.forEach(o => obj[o.id] = o);
  return obj;
};
const checkForErrors = result => {
  if (result.errors) throw result.first_error; // This throw should happen in a promise
  return result;
};

/* Builders return a Promise that resolves data, they assume their params are validated */

const builders = {
  
  login: (c, { email }) => r.table('users')
    .filter(user => r.or(user('email').eq(email), user('username').eq(email)))
    .limit(1)
    .without('createdAt', 'updatedAt', 'creationIp') // We want passwordHash
    .run(c)
    // .then(cursor => cursor.next()), // This can throw so for now it's a slow array creation...
    .then(pickFirst),
  
  logout: () => Promise.resolve(),
  
  // Reads all documents for a given collection
  readAll: (c, { table }) => r.table(table).run(c).then(toArray).then(normalize),
  
  readUserByUsername: (c, { username }) => r.table('users')
    .filter({ username })
    .limit(1)
    .without(...forbiddenKeys)
    .run(c)
    .then(pickFirst),
  
  randomRow: (c, { table }) => r.table(table).orderBy(row => r.random()).limit(1).run(c),
};

// Defaults can be overwritten
export default Object.assign({}, createDefaultCRUDBuilders(), builders);


// Default CRUD operations for models
function createDefaultCRUDBuilders() {
  
  const builders = {};
  
  for (let model in definitions) {
    const suffix = capitalizeFirstChar(model);
    const t = r.table(definitions[model].pluralName);
    
    builders['read' + suffix] = (c, { id }) => t.getAll(id) // getAll not get, see https://github.com/rethinkdb/rethinkdb/issues/3381
    .without(...forbiddenKeys)
    .run(c)
    .then(pickFirst);
    
    builders['create' + suffix] = (c, params) => t.insert(params).run(c)
    .then(checkForErrors)
    .then(result => {
      const x = Object.assign({}, params, { id: result.generated_keys[0] });
      ['createdAt', 'updatedAt', 'creationIp'].map(k => delete x[k]);
      return x;
    });
      
    builders['update' + suffix] = (c, params) => {
      const p = Object.assign({}, params);
      delete p.id;
      return t.get(params.id).update(p).run(c).then(checkForErrors);
    };
    
    builders['delete' + suffix] = (c, { id }) => t.get(id).delete().run(c).then(checkForErrors);
  }
  
  return builders;
}
