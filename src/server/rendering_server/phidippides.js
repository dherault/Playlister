import logg from '../../shared/utils/logger';

export default function phidippides(store, renderProps) {
  
  if (!store) return Promise.reject("Phidippides: missing 'store' arg");
  if (!renderProps) return Promise.reject("Phidippides: missing 'renderProps' arg");
  
  // console.log(renderProps)
  // if (true) return Promise.reject('Oh no! This is a fake rejection for dev purposes');
  // if (true) return Promise.reject(new Error('Oh no! This is a fake rejection error for dev purposes'));
  
  // Configuration
  const VERBOSE     = false;            // Display logs or not
  const METHOD_NAME = 'runPhidippides'; // The static method name in React comps
  const MAX_CYCLES  = 15;               // Max cycle number before rejection
  
  // Internals
  const NOT_FOUND = 'phidippides_not_found';
  
  const { dispatch, getState } = store;
  const { userId, token } = getState().session;
  
  let cycleCount        = 0;  // Prevents infinite loops (like: task1.dependencyId = task2; task2.dependencyId = taks1)
  let failedTasks       = []; // Uncleared tasks because dependencies are missing
  let completedTasksIds = []; // Cleared tasks ids
  let shouldReply404    = false;
  
  // Fetches the tasks within components
  const tasks = renderProps.components
  .filter(component => component)
  .map   (component => component.WrappedComponent || component)  
  .map   (component => component[METHOD_NAME]      )  // Looks for runPhidippides in React comp
  .filter(method    => typeof method === 'function')
  .map   (method    => method(renderProps, userId) )  // Calls runPhidippides
  .filter(returned  => returned instanceof Array   )  // runPhidippides should only return an array of tasks
  .reduce((a, b)    => a.concat(b), []             )
  .filter(task      => checkFormat(task)           ); // Validates tasks shape
  
  const nTasks = tasks.length;
  if (!nTasks) return Promise.resolve();
  logg(`.P. Resolving  ${nTasks} ${nTasks > 1 ? 'tasks:' : 'task:'} ${tasks.map(task => task.id)}`);
  
  return clearTasks(tasks);
  

  function log(...messages) {
    if (VERBOSE) logg('.P.', ...messages);
  }
  
  
  // Clears the given tasks
  function clearTasks(tasks) {
    cycleCount++;
    failedTasks = [];
    if (cycleCount >= MAX_CYCLES) return Promise.reject('Infinite loop detected in phidippides');
    
    // So phidippides returns this promise
    return Promise.all(tasks.map(task => clearOneTask(task))).then(results => {
      log('\n');
      log('* clearTasks ended * ');
      log('Completed tasks:', completedTasksIds);
      log('Failed tasks:', failedTasks.map(task => task.id));
      log('\n');
      
      // If a task with the 'notFoundTriggers404' gets a 404 from the API, then clearOneTask resolves NOT_FOUND
      if (results.some(r => r === NOT_FOUND)) shouldReply404 = true;
      
      // If no task is left then it's over
      if (!failedTasks.length) return shouldReply404;
      
      // Otherwise the program will try to process the uncleared tasks
      // Hoping that dependencies have been cleared
      // Therefore the possible infinite loop
      else return clearTasks(failedTasks);
    });
  }
  
  
  function clearOneTask(task) {
    
    // A rejection here makes clearTasks reject and therefore phidippides reject, thus 500
    return new Promise((resolve, reject) => {
      
      const { id, actionCreator, getParams, dependencyId, notFoundTriggers404 } = task;
      
      log('clearOneTask', id);
      
      // If there is a uncleared dependency
      if (dependencyId && completedTasksIds.indexOf(dependencyId) === -1) {
        
        failedTasks.push(task);
        log(`clearOneTask ${id} failed: missing dependency ${dependencyId}`);
        return resolve(); // This is not a rejection: we are just waiting for the dependency
        
      } else {
        
        log(`_ calling actionCreator for task ${id}`);
        const action = actionCreator(getParams(getState()), token);
        const { promise } = action;
        
        dispatch(action);
        
        // No promise, no problem, but really this is a fetch utility so there is always a promise
        if (!promise) {
          completedTasksIds.push(id);
          log(`clearOneTask ${id} complete`);
          return Promise.resolve();
        } 
        
        else promise.then(data => {
          log(` _ Dispatch for ${id} resolved`);
          if (data) log(JSON.stringify(data).substr(0,150));
          log(`clearOneTask ${id} complete`);
          
          completedTasksIds.push(id);
          resolve();
          
        }, response => {
          if (response.status === 404) {
            completedTasksIds.push(id);
            return resolve(notFoundTriggers404 ? NOT_FOUND : undefined);
          } 
          reject(response); // 500
        });
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
}
