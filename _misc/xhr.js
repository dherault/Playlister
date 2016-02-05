import isServer from './isServer';
import log from './logger';

// A promise wrapper around XMLHttpRequest 
export default function xhr(method, path, params, token, verbose=true) {
  
  if (verbose) log('... xhr', method, path, params || '');
  
  if (!method || !path) throw new Error('makeHttpRequest: method or path arg missing');
  
  return new Promise((resolve, reject) => {
    
    // Universal xhr is ugly for now
    const Xhr = isServer ? require('xhr2') : XMLHttpRequest;
    const xhr = new Xhr();
    const m = method.toLowerCase();
    const isPost = m === 'post' || m === 'put';
    
    // URI construction
    let pathWithQuery = path;
    if (!isPost && params) {
      pathWithQuery += '?';
      let addand = false;
      
      for (let key in params) {
        const val = params[key];
        addand ? pathWithQuery += '&' : addand = true;
        if (val) pathWithQuery += `${encodeURIComponent(key)}=${encodeURIComponent(val)}`;
      }
    }
    
    xhr.onerror = error => reject({ 
      error,
      status: 0, 
      response: 'An error occured, check your internet connection.', 
    });
    
    xhr.open(m, pathWithQuery);
    
    // Authentication matters
    if (token) {
      if (typeof token === 'boolean') xhr.withCredentials = token;
      else if (typeof token === 'string') xhr.setRequestHeader("Authorization", token);
    }
    
    xhr.onload = () => {
      const { status, response } = xhr;
      try {
        const parsed = response ? JSON.parse(response) : null;
        status === 200 ? resolve(parsed) : reject({ status, response: parsed });
      }
      catch (error) {
        reject({ error, status, response });
      }
    };
    
    if (isPost) {
      xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      xhr.send(JSON.stringify(params));
    }
    else xhr.send(); // Bon voyage !
  });
}
