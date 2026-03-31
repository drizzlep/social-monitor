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

export type Platform = 'all' | 'wechat' | 'xiaohongshu'
export type DateRange = 7 | 30 | 90
export type SortField = 'date' | 'likes' | 'comments'

// Mock data matching Phase 1 format
const mockData: SocialItem[] = [
  {
    id: 'mock-1',
    platform: 'wechat',
    title: '原木家具选购指南：如何挑选高品质实木家具',
    author: '家居美学',
    date: '2026-03-24',
    url: 'https://mp.weixin.qq.com/s/example1',
    content: '实木家具因其天然环保、经久耐用的特性，越来越受消费者青睐。本文将从木材种类、工艺细节、漆面处理等方面，为大家详细介绍如何选购高品质的原木家具...',
    likes: 892,
    comments: 56,
    shares: 234,
    brand: '良禽佳木',
    keyword: '实木家具',
    tags: ['实木', '选购指南', '家居']
  },
  {
    id: 'mock-2',
    platform: 'xiaohongshu',
    title: '北欧风原木书房搭配 | 简约不简单🏠',
    author: '小红书用户-设计控',
    date: '2026-03-23',
    url: 'https://www.xiaohongshu.com/explore/example2',
    content: '最近给书房来了个大改造，选了良禽佳木的白橡木书桌，搭配同色系的实木书架，整个空间瞬间温馨起来。书桌的纹理非常漂亮，是真正的原木质感...',
    likes: 2341,
    comments: 89,
    shares: 156,
    brand: '良禽佳木',
    keyword: '白橡木',
    tags: ['北欧风', '书房', '原木']
  },
  {
    id: 'mock-3',
    platform: 'wechat',
    title: '定制家具 vs 成品家具：深度对比分析',
    author: '装修那点事',
    date: '2026-03-22',
    url: 'https://mp.weixin.qq.com/s/example3',
    content: '新房装修在即，定制家具和成品家具究竟该怎么选？本文将从预算、工期、个性化、品质控制等维度进行全面对比分析，帮你做出最合适的选择...',
    likes: 1245,
    comments: 178,
    shares: 456,
    brand: '良禽佳木',
    keyword: '定制家具',
    tags: ['定制', '对比', '装修']
  },
  {
    id: 'mock-4',
    platform: 'xiaohongshu',
    title: '黑胡桃木餐桌真实测评 | 良禽佳木值不值',
    author: '家居博主-阿白',
    date: '2026-03-21',
    url: 'https://www.xiaohongshu.com/explore/example4',
    content: '用了三个月来客观评价这款黑胡桃木餐桌。优点：做工精细，边角打磨很光滑，没有毛刺；木材纹理非常漂亮，是真实的 FAS 级木材...',
    likes: 5678,
    comments: 234,
    shares: 567,
    brand: '良禽佳木',
    keyword: '黑胡桃木',
    tags: ['测评', '餐桌', '黑胡桃']
  },
  {
    id: 'mock-5',
    platform: 'wechat',
    title: '实木家具保养全攻略：让家具多用20年',
    author: '品质生活家',
    date: '2026-03-20',
    url: 'https://mp.weixin.qq.com/s/example5',
    content: '实木家具娇贵吗？其实只要掌握正确的保养方法，实木家具不仅耐用，还能越用越有韵味。今天就来分享几个实木家具保养的小技巧...',
    likes: 3201,
    comments: 145,
    shares: 678,
    brand: '良禽佳木',
    keyword: '实木保养',
    tags: ['保养', '教程', '实木']
  },
  {
    id: 'mock-6',
    platform: 'xiaohongshu',
    title: '原木风卧室软装 | 打造温馨睡眠空间',
    author: '软装设计师阿雅',
    date: '2026-03-19',
    url: 'https://www.xiaohongshu.com/explore/example6',
    content: '卧室是我们每天待得最久的空间，营造温馨舒适的氛围至关重要。今天分享一套原木风卧室软装方案，主角当然是良禽佳木的实木床和床头柜...',
    likes: 4123,
    comments: 167,
    shares: 289,
    brand: '良禽佳木',
    keyword: '实木床',
    tags: ['卧室', '软装', '原木风']
  }
]

function getDateNDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

export async function fetchItems(
  platform: Platform = 'all',
  dateRange: DateRange = 30
): Promise<SocialItem[]> {
  const cutoff = getDateNDaysAgo(dateRange)

  let items = mockData.filter((item) => {
    if (item.date < cutoff) return false
    if (platform !== 'all' && item.platform !== platform) return false
    return true
  })

  // Sort by date descending
  items = items.sort((a, b) => b.date.localeCompare(a.date))

  return items
}

export async function fetchItemById(id: string): Promise<SocialItem | null> {
  return mockData.find((item) => item.id === id) || null
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

  let items = mockData.filter((item) => {
    if (item.date < cutoff) return false
    if (platform !== 'all' && item.platform !== platform) return false
    if (brand && !item.brand?.includes(brand)) return false
    if (keyword && !item.title.includes(keyword) && !item.content.includes(keyword)) return false
    return true
  })

  // Sort
  if (sort === 'likes') {
    items = items.sort((a, b) => b.likes - a.likes)
  } else if (sort === 'comments') {
    items = items.sort((a, b) => b.comments - a.comments)
  } else {
    items = items.sort((a, b) => b.date.localeCompare(a.date))
  }

  const total = items.length
  const start = (page - 1) * pageSize
  const pagedItems = items.slice(start, start + pageSize)

  return { items: pagedItems, total }
}

export async function getStats(dateRange: DateRange = 30) {
  const items = await fetchItems('all', dateRange)

  const totalItems = items.length

  // Top brand
  const brandCount: Record<string, number> = {}
  for (const item of items) {
    const b = item.brand || '未知'
    brandCount[b] = (brandCount[b] || 0) + 1
  }
  const topBrand = Object.entries(brandCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '无数据'

  // Top keyword (by tags + title keywords)
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
    xiaohongshu: '小红书'
  }
  return map[platform]
}

export function platformBadgeClass(platform: string): string {
  if (platform === 'wechat') return 'badge badge-wechat'
  if (platform === 'xiaohongshu') return 'badge badge-xiaohongshu'
  return 'badge badge-tag'
}
