/* For now everything is shared, letting the client access critical data */

let config = {
  host: 'localhost',
  mongo: {
    url: 'mongodb://localhost:27017/',
    dbs: {
      main: 'playlister',
      kvs: 'kvs',
    }
  },
  jwt: {
    secretKey: 'secret',
    kvsStore: 'sessions',
    cookieOptions: {
      ttl: 1000 * 60 * 15,
      encoding: 'none',    // we already used JWT to encode
      // isSecure: false,      // warm & fuzzy feelings
      // isHttpOnly: false,    // prevent client alteration
      // clearInvalid: false, // remove invalid cookies
      // strictHeader: true   // don't allow violations of RFC 6265
    },
  },
  services: {
    rendering: {
      port: 3000
    },
    webpack: {
      port: 3001,
    },
    asset: {
      port: 3002,
    },
    api: {
      port: 3003,
    },
    websocket: {
      port: 3004,
      
      // Allows connection between websocket services and other services
      serviceSecretNamespace: 'asecret',
      servicesSecretKey: 'anothersecret',
    },
    kvs: {
      port: 3005,
    },
    image: {
      port: 3006,
    },
  }
};

// Stupid but good for now
for (let key in config.services) {
  const x = config.services[key];
  x.url = `http://${config.host}:${x.port}/`;
}

export default config;
