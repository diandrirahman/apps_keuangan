import { GoogleGenerativeAI } from '@google/generative-ai'
import { env } from '../../config/env.js'

export class GeminiProvider {
  async extractJson(prompt: string, image: Buffer, mimeType: string): Promise<unknown> {
    if (!env.GEMINI_API_KEY) throw new Error('AI belum dikonfigurasi')
    const client = new GoogleGenerativeAI(env.GEMINI_API_KEY)
    const model = client.getGenerativeModel({ model: env.GEMINI_MODEL })
    const response = await model.generateContent([prompt, { inlineData: { data: image.toString('base64'), mimeType } }])
    const text = response.response.text().replace(/^```json\s*|\s*```$/g, '').trim()
    return JSON.parse(text) as unknown
  }
}
