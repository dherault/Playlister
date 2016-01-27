import XMLHttpRequestNode from 'xmlhttprequest';

import isServer from './isServer';

// A promise wrapper around XMLHttpRequest 
export default function makeHttpRequest(method, path, params) {
  
  console.log('... makeHttpRequest', method, path, params || '');
  if (!method || !path) return Promise.reject(new Error('makeHttpRequest: method or path arg missing'));
  
  return new Promise((resolve, reject) => {
    
    // Universal xhr is ugly fow now
    const xhr = isServer ? new XMLHttpRequestNode.XMLHttpRequest() : new XMLHttpRequest();
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
      const { status, response, responseText } = xhr;
      
      try {
        const parsed = JSON.parse(isServer ? responseText : response);
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