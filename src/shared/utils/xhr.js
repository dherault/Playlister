import isServer from './isServer';
import log from './logger';

// A promise wrapper around XMLHttpRequest 
export default function xhr(method, path, params, headers) {
  
  log('... xhr', method, path, params || '');
  
  if (!method || !path) throw new Error('makeHttpRequest: method or path arg missing');
  
  return new Promise((resolve, reject) => {
    
    // Universal xhr is ugly for now
    const Xhr = isServer ? require('xhr2') : XMLHttpRequest;
    
    const xhr = new Xhr();
    xhr.withCredentials = true;
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
    
    if (headers) {
      for (let key in headers) {
        xhr.setRequestHeader(key, headers[key]);
      }
    }
    
    if (isPost) {
      xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      xhr.send(JSON.stringify(params));
    }
    else xhr.send(); // Bon voyage !
  });
}