// import nodeFetch from 'node-fetch';
import isServer from './isServer';
import isPlainObject from 'lodash/isPlainObject';
// import log from './logger';

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    const error = new Error(response.statusText);
    error.response = response;
    throw error;
  }
}

export default function customFetch(url, params, options={}) {
  
  // Universal fetch is ugly for now
  const fetch = isServer ? require('node-fetch') : window.fetch;
  
  const m = options.method ? options.method.toLowerCase() : 'get';
  const isPost = m === 'post' || m === 'put';
  
  let urlWithQuery = url;
  
  if (isPost) {
    options.body = JSON.stringify(params);
    options.headers = options.headers || {};
    options.headers['Content-Type'] = 'application/json'; // If bug maybe : application/json;charset=UTF-8
    
  } else if (params && isPlainObject(params)) {
    // URI construction
    urlWithQuery += '?';
    let addAnd = false;
    
    for (let key in params) {
      const val = params[key];
      addAnd ? urlWithQuery += '&' : addAnd = true;
      if (val) urlWithQuery += `${encodeURIComponent(key)}=${encodeURIComponent(val)}`;
    }
  }
  
  return fetch(urlWithQuery, options)
    .then(checkStatus)
    .then(r => r.json());
}
