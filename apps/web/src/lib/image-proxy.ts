/**
 * 图片代理工具函数
 * 用于解决外部图片403防盗链问题
 */

/**
 * 将外部图片URL转换为代理URL
 * @param originalUrl 原始图片URL
 * @returns 代理后的URL
 */
export function getProxyImageUrl(originalUrl: string): string {
  if (!originalUrl) return ''
  
  // 如果是本地图片或者已经是代理URL，直接返回
  if (originalUrl.startsWith('/') || originalUrl.includes('/api/proxy-image')) {
    return originalUrl
  }
  
  // 如果是data URL，直接返回
  if (originalUrl.startsWith('data:')) {
    return originalUrl
  }
  
  // 编码原始URL并通过代理服务获取
  const encodedUrl = encodeURIComponent(originalUrl)
  return `/api/proxy-image?url=${encodedUrl}`
}

/**
 * 检查图片URL是否需要代理
 * @param url 图片URL
 * @returns 是否需要代理
 */
export function needsProxy(url: string): boolean {
  if (!url) return false
  
  // 本地图片、data URL、已代理的URL不需要再次代理
  if (
    url.startsWith('/') || 
    url.startsWith('data:') || 
    url.includes('/api/proxy-image')
  ) {
    return false
  }
  
  // 外部HTTP/HTTPS图片需要代理
  return url.startsWith('http://') || url.startsWith('https://')
}

/**
 * 批量处理图片URL代理
 * @param urls 图片URL数组
 * @returns 代理后的URL数组
 */
export function batchProxyImageUrls(urls: string[]): string[] {
  return urls.map(url => getProxyImageUrl(url))
} 