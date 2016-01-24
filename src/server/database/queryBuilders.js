import log from '../../utils/logger';
import { capitalizeFirstChar } from '../../utils/textUtils';

// function addDefaultCRUDBuilders(run, builders) {
  
//   const CRUDbuilders = {};
  
//   for (let model in definitions) {
//     const { name, pluralName } = definitions[model];
//     const suffix = capitalize(name);
    
//     CRUDbuilders['read' + suffix] = ({ id }) => run(r.table(pluralName).get(id))
//       .then(res => ({ [pluralName]: { [id]: res } }));
//     CRUDbuilders['create' + suffix] = params => run(r.table(pluralName).insert(params))
//       .then(result => {
//         const p = Object.assign({}, params);
//         const id = result.generated_keys[0];
//         ['creationIp', 'createdAt', 'updatedAt', 'passwordHash'].map(key => delete p[key])
//         return { [pluralName]: { [id]: { ...p, id } } };
//       });
//     CRUDbuilders['update' + suffix] = ({id, ...params }) => run(r.table(pluralName).get(id).update(Object.assign(params, { updatedAt: new Date().getTime() })))
//       .then(result => ({}));
//     CRUDbuilders['delete' + suffix] = ({ id }) => run(r.table(pluralName).get(id).delete());
//   }
  
//   return Object.assign(CRUDbuilders, builders);
// }

/* Builders return a Promise that resolves the data */
export default db => ({
  
  // Reads all items for a given collection
  readAll: params => new Promise((resolve, reject) => {
    db.collection(params.collection).find().toArray((err, items) => err ? reject(err) : resolve(items));
  }),
  
  
});
