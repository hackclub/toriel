const { StatsD } = require('node-statsd')

const env = process.env.NODE_ENV || 'development'
const graphite = process.env.GRAPHITE_HOST

if (env.toLowerCase() == 'production' && graphite == null) {
  throw new Error('Graphite is not working')
}

const options = {
  host: graphite,
  port: 8125,
  prefix: `${env}.toriel.`,
}

const metrics = new StatsD(options)

module.exports = { metrics }
