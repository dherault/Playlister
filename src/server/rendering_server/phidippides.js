import { createLogger } from '../../shared/utils/logger';

const logger = createLogger({
  prefix: '.P.',
  chalk: 'bgBlue',
});

/*
  Phidippides takes charge of data fetching on server-side renders
  It looks in the current route's components for tasks describing what to fetch (actionCreator + params)
  A task can depend on other tasks that need to be completed before itself
  So the dependent task can access the new state to modify it's params, or cancel itself (params == false)
  todo: support for multiple dependencies (--> when needed)
*/

// Returns a promise that resolves falsy if ok, truthy if the rendering server should fire a 404
export default function phidippides(store, renderProps) {
  
  if (!store || !renderProps) return Promise.reject('Phidippides: missing arg');
  
  // console.log(renderProps)
  // if (true) return Promise.reject(new Error('Oh no! This is a fake rejection for dev purposes'));
  
  /* Configuration */
  const VERBOSE     = false;            // Display logs or not
  const METHOD_NAME = 'runPhidippides'; // The static method name in React comps
  const MAX_CYCLES  = 15;               // Max cycle number before rejection
  
  /* * */
  const { dispatch, getState } = store;
  const { userId, token } = getState().session;
  
  let failedTasks       = []; // Uncleared tasks because dependencies are missing
  let completedTasksIds = []; // Cleared tasks ids
  let cycleCount        = 0;  // Prevents infinite loops (like: task1.dependencyId = task2; task2.dependencyId = taks1)
  
  // Fetches the tasks within components
  const tasks = renderProps.components
  .map   (component => component.WrappedComponent || component)  // redux.connect wraps components
  .map   (component => component[METHOD_NAME]      )  // Looks for runPhidippides in React comp
  .filter(method    => typeof method === 'function')
  .map   (method    => method(renderProps, userId) )  // Calls runPhidippides
  .reduce((a, b)    => a.concat(b), []             )  // Assumes runPhidippides returned an array of tasks
  .filter(task      => checkFormat(task)           ); // Validates tasks shape
  
  if (!tasks.length) return Promise.resolve();
  
  logger(`Tasks: ${tasks.map(t => t.id)}`);
  
  return performTasks(tasks);
  
  
  // Clears the given tasks
  function performTasks(tasks) {
    cycleCount++;
    failedTasks = [];
    if (cycleCount >= MAX_CYCLES) return Promise.reject('Infinite loop detected in phidippides');
    
    // So Phidippides returns this promise
    return Promise.all(tasks.map(task => performOneTask(task))).then(results => {
      log('\n');
      log('* performTasks ended * ');
      log('Completed tasks:', completedTasksIds);
      log('Failed tasks:', failedTasks.map(task => task.id));
      log('\n');
      
      // If no task is left then it's over
      // If a task with the 'notFoundTriggers404' key gets a 404 from the API, then performOneTask resolves truthy
      if (!failedTasks.length) return results.some(r => r);
      
      // Otherwise the program will try to process the uncleared tasks
      // Hoping that the dependencies were cleared
      // Therefore the possible infinite loop
      else return performTasks(failedTasks);
    });
  }
  
  
  function performOneTask(task) {
    
    // A rejection here makes clearTasks reject and therefore phidippides reject, thus 500
    return new Promise((resolve, reject) => {
      
      const { id, actionCreator, getParams, dependencyId, notFoundTriggers404 } = task;
      
      const resolveTask = toResolve => {
        completedTasksIds.push(id);
        log(`clearOneTask ${id} complete`);
        resolve(toResolve);
      };
      
      log('clearOneTask', id);
      
      // If there is a uncleared dependency the task fails
      if (dependencyId && completedTasksIds.indexOf(dependencyId) === -1) {
        
        failedTasks.push(task);
        log(`clearOneTask ${id} failed: missing dependency ${dependencyId}`);
        return resolve(); // This is not a rejection: we are just waiting for the dependency
        
      // No dependency or dependencies completed 
      } else {
        
        const params = getParams(getState());
        
        if (params) {
          
          log(`_ Calling actionCreator for ${id}`);
          
          const action = actionCreator(params, token);
          const { promise } = action;
          
          dispatch(action);
          
          // No promise, no problem, but really this is a fetch utility so there is always a promise
          if (!promise) resolveTask();
          
          else promise.then(data => {
            log(` _ Dispatch for ${id} resolved:`);
            log(data ? JSON.stringify(data) : data);
            resolveTask();
          })
          // All status codes > 301 but 404 from the API trigger a 500 on this server
          .catch(err => err.status === 404 ? resolveTask(notFoundTriggers404) : reject(err));
        } else {
          // No params, no action
          log(`_ No params found for ${id}, skipping`);
          resolveTask();
        }
      }
    });
  }
  
  // Checks the shape of a task
  function checkFormat(task) {
    if (process.env.NODE_ENV !== 'production') {
      let whatIsWrong = '';
      
      if (task.hasOwnProperty('id')) {
        if (typeof task.id !== 'string') whatIsWrong += '\'id\' property should be a string\n';
      } 
      else whatIsWrong += 'task is missing \'id\' property\n';
      
      if (task.hasOwnProperty('actionCreator')) {
        if (typeof task.actionCreator !== 'function') whatIsWrong += '\'actionCreator\' property should be a function\n';
      } 
      else whatIsWrong += 'task is missing \'actionCreator\' property\n';
      
      if (task.hasOwnProperty('getParams')) {
        if (typeof task.getParams !== 'function') whatIsWrong += '\'getParams\' property should be a function\n';
      } 
      else whatIsWrong += 'task is missing \'getParams\' property\n';
      
      if (task.hasOwnProperty('dependencyId') && typeof task.dependencyId !== 'string') whatIsWrong += '\'dependencyId\' property should be a string\n';
      
      if (whatIsWrong.length) {
        log('!!! Please check format for task:', JSON.stringify(task), whatIsWrong);
        
        return false;
      }
    }
    
    return true;
  }
  
  function log(...messages) {
    if (VERBOSE) return logger(...messages);
  }
}
