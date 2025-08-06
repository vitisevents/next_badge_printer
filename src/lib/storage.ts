// Storage abstraction layer for local vs production
import { put, list, del } from '@vercel/blob'

const IS_LOCAL_DEV = process.env.NODE_ENV === 'development' && !process.env.BLOB_READ_WRITE_TOKEN

export const storage = {
  async put(pathname: string, body: any, options?: any) {
    if (IS_LOCAL_DEV) {
      // Local development fallback - store in memory/localStorage
      console.warn('Using local storage fallback - data will not persist between server restarts')
      // You could implement localStorage or file system storage here
      return {
        url: `/local-storage/${pathname}`,
        pathname,
        size: 0,
        uploadedAt: new Date()
      }
    }
    
    return await put(pathname, body, options)
  },

  async list(options?: any) {
    if (IS_LOCAL_DEV) {
      console.warn('Using local storage fallback - returning empty list')
      return { blobs: [] }
    }
    
    return await list(options)
  },

  async del(urls: string[]) {
    if (IS_LOCAL_DEV) {
      console.warn('Using local storage fallback - delete is no-op')
      return
    }
    
    return await del(urls)
  }
}