import isServer from './isServer';
import log from './logger';

// A promise wrapper around XMLHttpRequest 
export default function makeHttpRequest(method, path, params) {
  
  console.log('... makeHttpRequest', method, path, params || '');
  if (!method || !path) return Promise.reject(new Error('makeHttpRequest: method or path arg missing'));
  
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
    
    xhr.onerror = err => reject(err);
    xhr.open(m, pathWithQuery);
    xhr.onload = () => {
      const { status, response } = xhr;
      try {
        const parsed = response ? JSON.parse(response) : null;
        if (status === 200) resolve(parsed);
        else reject({ status, response: parsed });
      }
      catch (err) {
        reject(err);
      }
    };
    
    if (isPost) {
      xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      xhr.send(JSON.stringify(params));
    }
    else xhr.send(); // Bon voyage !
  });
}