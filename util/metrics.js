import StatsD from 'node-statsd'

const enviorment = process.env.NODE_ENV;
const graphite = process.env.GRAPHITE_HOST;

if (graphite == null) {
  throw new Error("Graphite is not working");
}

const options = {
  host: graphite,
  port: 8125,
  prefix: `${enviorment}.toriel.`,
}

const metrics = new StatsD(options)

export default metrics;
