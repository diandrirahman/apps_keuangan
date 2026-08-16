import { Router } from 'express'
import { uploadInvoiceImage } from '../../middlewares/upload.middleware.js'
import { InvoiceController } from './invoice.controller.js'

const controller = new InvoiceController()
export const invoiceRouter = Router()
invoiceRouter.post('/extract', uploadInvoiceImage, controller.extract)
