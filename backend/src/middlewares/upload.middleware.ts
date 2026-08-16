import multer from 'multer'

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp']
export const uploadInvoiceImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => callback(null, allowedMimeTypes.includes(file.mimetype)),
}).single('image')
