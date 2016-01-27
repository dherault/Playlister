let config = {
  host: 'localhost',
  mongo: {
    uri: 'mongodb://localhost:27017/',
    dbs: {
      main: 'playlister',
      kvs: 'kvs',
    }
  },
  services: {
    webpack: {
      port: 8080
    },
    api: {
      port: 8181,
    },
    websocket: {
      port: 8282,
      serviceSecretNamespace: 'asecret',
      servicesSecretKey: 'anothersecret', // Allows connection between websocket services and other services
    },
    image: {
      port: 8383,
    },
    kvs: {
      port: 8484,
    }
  }
};

config.mongo.url = config.mongo.uri + config.mongo.dbs.main;

export default config;
