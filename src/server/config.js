let config = {
  host: 'localhost',
  mongo: {
    uri: 'mongodb://localhost:27017/',
    dbs: {
      main: 'playlister',
      kvs: 'kvs',
    }
  },
  jwt: {
    secretKey: 'secret',
    kvsStore: 'sessions',
    cookieOptions: {
      ttl: 1000 * 60 * 60,
      encoding: 'none',    // we already used JWT to encode
      isSecure: false,      // warm & fuzzy feelings
      isHttpOnly: false,    // prevent client alteration
      clearInvalid: false, // remove invalid cookies
      strictHeader: true   // don't allow violations of RFC 6265
    },
  },
  services: {
    webpack: {
      port: 8080
    },
    api: {
      port: 8181,
      urlNamespace: 'api',
    },
    websocket: {
      port: 8282,
      serviceSecretNamespace: 'asecret',
      servicesSecretKey: 'anothersecret', // Allows connection between websocket services and other services
    },
    image: {
      port: 8383,
      urlNamespace: 'img',
    },
    kvs: {
      port: 8484,
    }
  }
};

config.mongo.url = config.mongo.uri + config.mongo.dbs.main;

// Stupid but good for now
for (let key in config.services) {
  const x = config.services[key];
  x.url = 'http://localhost:' + x.port + '/' + (x.urlNamespace ? x.urlNamespace + '/' : '');
}

export default config;
