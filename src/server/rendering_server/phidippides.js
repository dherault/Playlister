import logg from '../../shared/utils/logger';
import actionCreators from '../../shared/state/actionCreators';

export default function phidippides(renderProps, dispatch) {
  
  if (!renderProps) return Promise.resolve();
  
  // Configuration
  const VERBOSE      = true;            // Affiche les log
  const PLACEHOLDER  = '_dependency_.';  // Le placeholder pour les arguments des actions
  const METHOD_NAME  = 'runPhidippides'; // Le nom de la méthode des composants react
  const DEVELOPMENT  = process.env.NODE_ENV !== 'production';
  
  let cycleCount     = 0;  // Compte le nombre de cycles pour empecher les boucles infinies (-_-)
  let failedTasks    = []; // Les tâches non terminées car il manque les dépendances
  let completedTasks = {}; // Les tâches terminée
  
  // Récupère les tâches
  // console.log(renderProps)
  const tasks = renderProps.components
  .filter(component => component)
  .map   (component => component.WrappedComponent || component)  
  .map   (component => component[METHOD_NAME]      )  // Recherche de runPhidippides dans chaque handler
  .filter(method    => typeof method === 'function')  // Filtre si c'est une fonction
  .map   (method    => method(renderProps)         )  // Appel de runPhidippides
  .filter(returned  => returned instanceof Array   )  // Filtre si runPhidippides retourne un array (de tâches)
  .reduce((a, b)    => a.concat(b), []             )  // Réduction de l'array d'array de tâches en array de tâches
  .filter(task      => checkFormat(task)           ); // Évince les tâches hors format
  
  const nTasks = tasks.length;
  if (!nTasks) return Promise.resolve();
  logg(`.P. Resolving  ${nTasks} ${nTasks > 1 ? 'tasks:' : 'task:'} ${tasks.map(task => task.id)}`);
  
  // Exécute les tâches
  return clearTasks(tasks);
  

  // Log
  function log(...messages) {
    if (VERBOSE) logg(...messages);
  }
  
  
  // Complete toutes les tâches
  function clearTasks(tasks) {
    cycleCount++;
    failedTasks = []; // RAZ des tâches irrésolues devenues tâches à accomplir
    if (cycleCount > 10) throw('!!! Infinite loop detected');
    
    // Attend que toutes les tâches soient résolues
    return Promise.all(tasks.map(task => clearOneTask(task))).then(() => {
      log('\n');
      log('.P. * clearTasks ended * ');
      log('.P. completed tasks:', Object.keys(completedTasks));
      log('.P. failed tasks:', failedTasks.map(task => task.id));
      log('\n');
      
      // const tasks404 = tasks.filter(t => t.nullIs404 && completedTasks.hasOwnProperty(t.id) && completedTasks[t.id].notFound);
      
      // Si aucune tache n'a échoué c'est terminé
      // if (!failedTasks.length || tasks404.length) return;
      if (!failedTasks.length) return;
      
      // Sinon on rappel les tâches échouées (possible boucle infinie ici)
      else return clearTasks(failedTasks);
    });
  }
  
  
  // Complete une tâche
  function clearOneTask(task) {
    
    return new Promise((resolve, reject) => {
      
      const { id, creator, args, dependency } = task;
      let realArgs = [];
      
      log('.P. clearOneTask', id);
      
      if (!dependency || completedTasks[dependency]) {
        
        // Traitement des arguments
        args.forEach(arg => {
          log('.P. _ processing arg', arg);
          let realArg = arg;
          
          // Si un argument string possède PLACEHOLDER alors il faut le traiter
          if (typeof arg === 'string' && arg.search(PLACEHOLDER) !== -1) {
            log('.P. __ dependency found');
            
            // '__dependency.foo.bar' --> ['foo', 'bar'] --> completedTasks[task.dependency]['foo']['bar']
            const dataTree = arg.replace(PLACEHOLDER, '').split('.'); 
            realArg = completedTasks[dependency];
            for (let i = 0, l = dataTree.length; i < l; i++) {
              realArg = realArg[dataTree[i]]; 
            }
            
            log('.P. __ real arg is', realArg.toString().substring(0,20));
          }
          
          realArgs.push(realArg);
        });
        
        log(`.P. _ calling ${creator} with args`, ...realArgs);
        const action = actionCreators[creator](...realArgs);
        const { promise, payload } = action;
        
        dispatch(action);
        
        if (!promise) {
          completedTasks[id] = payload;
          resolve();
        } 
        
        else promise.then(
          data => {
            log(`.P.  _ Dispatch for ${id} resolved`);
            if (data) log(JSON.stringify(data).substr(0,150));
            log(`.P. clearOneTask ${id} complete`);
            completedTasks[id] = data;
            resolve();
          },
          reject
        );
        
      } else {
        failedTasks.push(task);
        log(`.P. clearOneTask ${id} failed: missing dependency ${dependency}`);
        resolve();
      }
    });
  }
  
  // Checks the integrity of markup in handlers
  function checkFormat(task) {
    if (DEVELOPMENT) {
      let whatIsWrong = '';
      
      if (task.hasOwnProperty('id')) {
        if (typeof task.id !== 'string') whatIsWrong += '\'id\' property should be a string\n';
      } 
      else whatIsWrong += 'task is missing \'id\' property\n';
      
      if (task.hasOwnProperty('creator')) {
        if (typeof task.creator !== 'string') whatIsWrong += '\'creator\' property should be a string\n';
        else if (typeof actionCreators[task.creator] !== 'function') whatIsWrong += `\'creator\':\'${task.creator}\' cannot be found in actionCreators\n`;
      } 
      else whatIsWrong += 'task is missing \'creator\' property\n';
      
      if (task.hasOwnProperty('args')) {
        if (!(task.args instanceof Array)) whatIsWrong += '\'args\' property should be an array\n';
      } 
      else whatIsWrong += 'task is missing \'args\' property\n';
      
      if (task.hasOwnProperty('dependency') && typeof task.dependency !== 'string') whatIsWrong += '\'dependency\' property should be a string\n';
      
      if (whatIsWrong.length) {
        log('!!! Please check format for task:', JSON.stringify(task), whatIsWrong);
        
        return false;
      }
    }
    
    return true;
  }
}
