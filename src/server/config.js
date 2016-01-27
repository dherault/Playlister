export default {
  host: 'localhost',
  services: {
    webpack: {
      port: 8080
    },
    api: {
      port: 8181,
      mongoURL: 'mongodb://localhost:27017/playlister',
    },
    websocket: {
      port: 8282
    },
    image: {
      port: 8383
    }
  }
}
