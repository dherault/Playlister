import r from 'rethinkdb';
import { capitalizeFirstChar } from '../../shared/utils/textUtils';
import definitions from '../../shared/models/definitions';

// todo remove that
// Field filtering
// const noDisclosure = { fields: { createdAt: 0, updatedAt: 0, creationIp: 0, passwordHash: 0 } };
// const noDisclosureLogin = { fields: { createdAt: 0, updatedAt: 0, creationIp: 0 } };

const forbiddenKeys = ['createdAt', 'updatedAt', 'creationIp', 'passwordHash'];

const aggregate = cursor => cursor.toArray();
const normalize = array => {  
  const obj = {};
  array.forEach(o => obj[o.id] = o);
  return obj;
};

/* Builders return a Promise that resolves data, they dont handle errors and assume their params are validated */
const builders = {
  
  login: (c, { email }) => r.table('users')
    .filter(r.row('email').eq(email).or(r.row('username').eq(email)))
    .limit(1)
    .without('createdAt', 'updatedAt', 'creationIp') // We want passwordHash
    .run(c),
    
  logout: () => Promise.resolve(),
  
  // Reads all documents for a given collection
  readAll: (c, { table }) => r.table(table).run(c).then(aggregate).then(normalize),
  
  readUserByUsername: (c, { username }) => r.table('users')
    .filter({ username })
    .limit(1)
    .without(...forbiddenKeys)
    .run(c),
  
  randomRow: (c, { table }) => r.table(table).orderBy(row => r.random()).limit(1).run(c),
};

// Defaults can be overwritten
export default Object.assign({}, createDefaultCRUDBuilders(), builders);

// Default CRUD operations for models
function createDefaultCRUDBuilders() {
  
  const builders = {};
  
  for (let model in definitions) {
    const { name, pluralName } = definitions[model];
    const suffix = capitalizeFirstChar(name);
    const t = r.table(pluralName);
    
    builders['read' + suffix] = (c, { id }) => t.get(id).without(...forbiddenKeys).run(c);
    builders['create' + suffix] = (c, params) => t.insert(params).run(c);
    builders['update' + suffix] = (c, params) => {
      const p = Object.assign({}, params);
      delete p.id;
      return t.get(params.id).update(p).run(c);
    };
    builders['delete' + suffix] = (c, { id }) => t.get(id).delete().run(c);
  }
  
  return builders;
}
