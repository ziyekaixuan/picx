import { ref } from 'vue'
import { PICX_IMAGE_RUNTIME_CACHE_NAME } from '@/common/constant'

/** 本地图片缓存条数上限，超出时按写入顺序淘汰最早的条目。 */
const MAX_CACHED_IMAGES = 300

/**
 * 图片缓存版本号，刷新图片缓存后递增，图片卡片监听它重新解析展示地址。
 */
export const imageCacheVersion = ref(0)

async function evictOldImages(cache: Cache): Promise<void> {
  const keys = await cache.keys()
  const overflow = keys.length - MAX_CACHED_IMAGES
  if (overflow <= 0)
    return
  await Promise.all(keys.slice(0, overflow).map(request => cache.delete(request, { ignoreVary: true })))
}

/**
 * 解析图片的本地缓存地址：命中缓存返回 blob 地址，未命中则下载后写入缓存再返回。
 * 不支持 CacheStorage、跨域受限或下载失败时回退到原始地址。
 */
export async function resolveCachedImageUrl(url: string): Promise<string> {
  if (typeof caches === 'undefined')
    return url
  try {
    const cache = await caches.open(PICX_IMAGE_RUNTIME_CACHE_NAME)
    const hit = await cache.match(url, { ignoreVary: true })
    if (hit)
      return URL.createObjectURL(await hit.blob())
    const response = await fetch(url, { mode: 'cors' })
    if (!response.ok)
      return url
    await cache.put(url, response.clone())
    await evictOldImages(cache)
    return URL.createObjectURL(await response.blob())
  }
  catch {
    return url
  }
}

/**
 * 清理指定仓库路径的图片缓存并通知图片卡片重新解析，用于刷新当前目录。
 */
export async function refreshImageCache(paths: string[]): Promise<void> {
  await purgeImageRuntimeCache(paths)
  imageCacheVersion.value += 1
}

/**
 * 清理 Service Worker 图片运行时缓存中命中指定仓库路径的条目，
 * 供上传覆盖、删除、移动、重命名成功后调用，避免管理页继续展示已被替换或删除的图片。
 * 缓存条目可能来自任意链接预设的域名，故按 URL path 后缀匹配而非完整 URL 匹配
 * @param paths 仓库内受影响的文件路径列表，如 ['dir/a.png']
 */
export async function purgeImageRuntimeCache(paths: string[]): Promise<void> {
  const targets = paths
    .filter(x => !!x)
    .map(x => `/${x.replace(/^\/+/, '')}`)
  if (!targets.length || typeof caches === 'undefined') {
    return
  }

  try {
    const cache = await caches.open(PICX_IMAGE_RUNTIME_CACHE_NAME)
    const requests = await cache.keys()
    await Promise.all(
      requests.map(async (request) => {
        const pathname = decodeURIComponent(new URL(request.url).pathname)
        if (targets.some(p => pathname.endsWith(p))) {
          await cache.delete(request, { ignoreVary: true })
        }
      }),
    )
  }
  catch {
    // 清理失败不影响主流程，最多表现为管理页短暂展示旧图
  }
}
