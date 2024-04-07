const { PrismaClient } = require('@prisma/client')
const { metrics } = require('./util/metrics')

const operationToType = {
  findUnique: 'find',
  findUniqueOrThrow: 'find',
  findFirst: 'find',
  findFirstOrThrow: 'find',
  findMany: 'find',
  create: 'create',
  createMany: 'create',
  update: 'update',
  updateMany: 'update',
  upsert: 'update',
  delete: 'delete',
  deleteMany: 'delete',
  aggregate: 'find',
  groupBy: 'find',
  count: 'find',
  findRaw: 'find',
}

const prisma = new PrismaClient().$extends({
  // extend prisma client
  // to send query metrics such as latency & failures
  query: {
    async $allOperations({ operation, model, args, query }) {
      const metricKey = `${operation}_${model}`
      console.log(metricKey, operationToType[operation])
      try {
        const start = performance.now()
        const queryResult = await query(args)
        const time = performance.now() - start

        metrics.timing(`prisma.latency.${metricKey}`, time)
        metrics.increment(`prisma.success.${operationToType[operation]}`, 1)
        metrics.increment(`prisma.success.model.${model}`, 1)
        return queryResult
      } catch (err) {
        console.log(err)
        metrics.increment(`prisma.errors.${operationToType[operation]}`, 1)
        metrics.increment(`prisma.errors.model.${model}`, 1)
      }
      return
    },
  },
})

module.exports = { prisma }
