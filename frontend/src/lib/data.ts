export interface SocialItem {
  id: string
  platform: 'wechat' | 'xiaohongshu'
  title: string
  author: string
  date: string
  url: string
  content: string
  likes: number
  comments: number
  shares: number
  brand?: string
  keyword?: string
  tags?: string[]
  [key: string]: unknown
}

export type Platform = 'all' | 'wechat' | 'xiaohongshu' | 'zhihu' | 'weibo' | 'douyin' | 'bilibili'
export type DateRange = 7 | 30 | 90
export type SortField = 'date' | 'likes' | 'comments'

function getDateNDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0]
}

async function fetchDataFile(date: string, platform: string): Promise<SocialItem[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(`/data/${date}/${platform}.json`, { signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) return []
    return await res.json()
  } catch (e) {
    console.error(`Failed to fetch ${platform} data for ${date}:`, e)
    return []
  }
}

async function fetchAllItems(dateStr: string): Promise<SocialItem[]> {
  const [wechat, xiaohongshu] = await Promise.all([
    fetchDataFile(dateStr, 'wechat'),
    fetchDataFile(dateStr, 'xiaohongshu')
  ])
  const items = [...wechat, ...xiaohongshu]
  // Fallback: if no data, return mock data so UI isn't empty
  if (items.length === 0) {
    return getFallbackData()
  }
  return items
}

// Fallback data when fetch fails
function getFallbackData(): SocialItem[] {
  return [
    {
      id: 'fallback-1',
      platform: 'wechat',
      title: '实木家具选购指南：如何挑选高品质实木家具',
      author: '家居美学志',
      date: new Date().toISOString().split('T')[0],
      url: '#',
      content: '数据加载中，请稍候...',
      likes: 0,
      comments: 0,
      shares: 0,
      brand: '良禽佳木',
      keyword: '实木家具',
      tags: ['实木', '选购指南']
    }
  ]
}

export async function fetchItems(
  platform: Platform = 'all',
  dateRange: DateRange = 30
): Promise<SocialItem[]> {
  const cutoff = getDateNDaysAgo(dateRange)
  const today = getTodayStr()

  let items = await fetchAllItems(today)

  items = items.filter((item) => {
    if (item.date < cutoff) return false
    if (platform !== 'all' && item.platform !== platform) return false
    return true
  })

  return items.sort((a, b) => b.date.localeCompare(a.date))
}

export async function fetchItemById(id: string): Promise<SocialItem | null> {
  const today = getTodayStr()
  const items = await fetchAllItems(today)
  return items.find((item) => item.id === id) || null
}

export async function searchItems(params: {
  platform?: Platform
  brand?: string
  keyword?: string
  dateRange?: DateRange
  sort?: SortField
  page?: number
  pageSize?: number
}): Promise<{ items: SocialItem[]; total: number }> {
  const { platform = 'all', brand, keyword, dateRange = 30, sort = 'date', page = 1, pageSize = 20 } = params
  const cutoff = getDateNDaysAgo(dateRange)
  const today = getTodayStr()

  let items = await fetchAllItems(today)

  items = items.filter((item) => {
    if (item.date < cutoff) return false
    if (platform !== 'all' && item.platform !== platform) return false
    if (brand && !item.brand?.includes(brand)) return false
    if (keyword && !item.title.includes(keyword) && !item.content.includes(keyword)) return false
    return true
  })

  if (sort === 'likes') {
    items.sort((a, b) => b.likes - a.likes)
  } else if (sort === 'comments') {
    items.sort((a, b) => b.comments - a.comments)
  } else {
    items.sort((a, b) => b.date.localeCompare(a.date))
  }

  const total = items.length
  const start = (page - 1) * pageSize
  const pagedItems = items.slice(start, start + pageSize)

  return { items: pagedItems, total }
}

export async function getStats(dateRange: DateRange = 30) {
  const items = await fetchItems('all', dateRange)

  const totalItems = items.length

  const brandCount: Record<string, number> = {}
  for (const item of items) {
    const b = item.brand || '未知'
    brandCount[b] = (brandCount[b] || 0) + 1
  }
  const topBrand = Object.entries(brandCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '无数据'

  const keywordCount: Record<string, number> = {}
  for (const item of items) {
    if (item.keyword) keywordCount[item.keyword] = (keywordCount[item.keyword] || 0) + 1
    if (item.tags) {
      for (const tag of item.tags) {
        keywordCount[tag] = (keywordCount[tag] || 0) + 1
      }
    }
  }
  const topKeyword = Object.entries(keywordCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '无数据'

  return { totalItems, topBrand, topKeyword }
}

export function platformLabel(platform: Platform): string {
  const map: Record<Platform, string> = {
    all: '全部',
    wechat: '微信公众号',
    xiaohongshu: '小红书',
    zhihu: '知乎',
    weibo: '微博',
    douyin: '抖音',
    bilibili: 'B站'
  }
  return map[platform]
}

export function platformBadgeClass(platform: string): string {
  if (platform === 'wechat') return 'badge badge-wechat'
  if (platform === 'xiaohongshu') return 'badge badge-xiaohongshu'
  if (platform === 'zhihu') return 'badge badge-zhihu'
  if (platform === 'weibo') return 'badge badge-weibo'
  if (platform === 'douyin') return 'badge badge-douyin'
  if (platform === 'bilibili') return 'badge badge-bilibili'
  return 'badge badge-tag'
}
