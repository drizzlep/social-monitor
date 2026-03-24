'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { searchItems, platformLabel, platformBadgeClass, type Platform, type DateRange, type SortField, type SocialItem } from '@/lib/data'

export default function SearchPage() {
  const [items, setItems] = useState<SocialItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [platform, setPlatform] = useState<Platform>('all')
  const [brand, setBrand] = useState('')
  const [keyword, setKeyword] = useState('')
  const [dateRange, setDateRange] = useState<DateRange>(30)
  const [sort, setSort] = useState<SortField>('date')
  const [loading, setLoading] = useState(false)
  const pageSize = 20

  const loadData = async () => {
    setLoading(true)
    const result = await searchItems({ platform, brand, keyword, dateRange, sort, page, pageSize })
    setItems(result.items)
    setTotal(result.total)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [platform, brand, keyword, dateRange, sort, page])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <header className="header">
        <div className="header-inner">
          <Link href="/" className="logo">良禽佳木 · 社交监测</Link>
          <nav className="nav">
            <Link href="/">数据概览</Link>
            <Link href="/search" className="active">搜索</Link>
          </nav>
        </div>
      </header>

      <main className="page">
        <h1 className="page-title">内容搜索</h1>

        {/* Filters */}
        <div className="filter-bar">
          <select className="filter-select" value={platform} onChange={(e) => { setPlatform(e.target.value as Platform); setPage(1) }}>
            <option value="all">全部平台</option>
            <option value="wechat">微信公众号</option>
            <option value="xiaohongshu">小红书</option>
            <option value="zhihu">知乎</option>
            <option value="weibo">微博</option>
            <option value="douyin">抖音</option>
            <option value="bilibili">B站</option>
          </select>

          <input
            type="text"
            className="filter-input"
            placeholder="品牌名称"
            value={brand}
            onChange={(e) => { setBrand(e.target.value); setPage(1) }}
          />

          <input
            type="text"
            className="filter-input"
            placeholder="关键词"
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
          />

          <select className="filter-select" value={dateRange} onChange={(e) => { setDateRange(Number(e.target.value) as DateRange); setPage(1) }}>
            <option value={7}>近7天</option>
            <option value={30}>近30天</option>
            <option value={90}>近90天</option>
          </select>

          <select className="filter-select" value={sort} onChange={(e) => { setSort(e.target.value as SortField); setPage(1) }}>
            <option value="date">按时间排序</option>
            <option value="likes">按点赞排序</option>
            <option value="comments">按评论排序</option>
          </select>
        </div>

        {/* Result count */}
        <div style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          共 {total} 条结果
        </div>

        {/* Item List */}
        <div className="item-list">
          {loading ? (
            <div className="empty-state">
              <div className="empty-state-text">加载中...</div>
            </div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-text">没有找到匹配的内容</div>
            </div>
          ) : (
            items.map((item) => (
              <Link href={`/detail/${item.id}`} key={item.id} className="item-card" style={{ display: 'block', textDecoration: 'none' }}>
                <div className="item-header">
                  <span className="item-title">{item.title}</span>
                  <span className={platformBadgeClass(item.platform)}>
                    {item.platform === 'wechat' ? '微信公众号' : '小红书'}
                  </span>
                  {item.brand && <span className="badge badge-tag">{item.brand}</span>}
                </div>
                <div className="item-meta">
                  <span>{item.author}</span>
                  <span>{item.date}</span>
                  <div className="item-stats">
                    <span>❤️ {item.likes.toLocaleString()}</span>
                    <span>💬 {item.comments.toLocaleString()}</span>
                    <span>🔗 {item.shares.toLocaleString()}</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              上一页
            </button>
            <span className="page-info">{page} / {totalPages}</span>
            <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              下一页
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
