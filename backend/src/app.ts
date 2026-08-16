import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import { invoiceRouter } from './modules/invoice-extraction/invoice.route.js'

const app = express()
app.use(cors({ origin: env.CLIENT_ORIGIN }))
app.get('/api/health', (_request, response) => response.json({ status: 'ok' }))
app.use('/api/invoices', invoiceRouter)

export { app }
export default app
