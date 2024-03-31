const { PrismaClient } = require('@prisma/client')
const { metrics } = require('./util/metrics')

const prisma = new PrismaClient().$extends({
  // extend prisma client
  // to send query metrics such as latency & failures
  query: {
    async $allOperations({ operation, model, args, query }) {
      const metricKey = `${operation}_${model}`
      try {
        const start = performance.now()
        const queryResult = await query(args)
        const time = performance.now() - start

        metrics.timing(`prisma.latency.${metricKey}`, time)

        return queryResult
      } catch (err) {
        metrics.increment(`prisma.errors.${metricKey}`, 1)
      }
      return
    },
  },
})

module.exports = { prisma }
