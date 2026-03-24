'use client'

import { useState } from 'react'
import Link from 'next/link'
import { fetchItems, getStats, platformLabel, platformBadgeClass, type Platform, type DateRange, type SocialItem } from '@/lib/data'

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange>(30)
  const [platform, setPlatform] = useState<Platform>('all')
  const [items, setItems] = useState<SocialItem[]>([])
  const [stats, setStats] = useState<{ totalItems: number; topBrand: string; topKeyword: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    const [itemsData, statsData] = await Promise.all([
      fetchItems(platform, dateRange),
      getStats(dateRange)
    ])
    setItems(itemsData.slice(0, 20))
    setStats(statsData)
    setLoading(false)
  }

  // Load on mount and when filters change
  useState(() => {
    loadData()
  })

  const handleDateRangeChange = (days: DateRange) => {
    setDateRange(days)
    loadData()
  }

  const handlePlatformChange = (p: Platform) => {
    setPlatform(p)
    loadData()
  }

  return (
    <div>
      <header className="header">
        <div className="header-inner">
          <Link href="/" className="logo">良禽佳木 · 社交监测</Link>
          <nav className="nav">
            <Link href="/" className="active">数据概览</Link>
            <Link href="/search">搜索</Link>
          </nav>
        </div>
      </header>

      <main className="page">
        <h1 className="page-title">数据概览</h1>

        {/* Date Range */}
        <div className="date-range">
          {([7, 30, 90] as DateRange[]).map((days) => (
            <button
              key={days}
              className={`date-btn ${dateRange === days ? 'active' : ''}`}
              onClick={() => handleDateRangeChange(days)}
            >
              近{days}天
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">采集内容</div>
              <div className="stat-value">{stats.totalItems}</div>
              <div className="stat-sub">条</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">热门品牌</div>
              <div className="stat-value">{stats.topBrand}</div>
              <div className="stat-sub">提及最多</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">热门关键词</div>
              <div className="stat-value">{stats.topKeyword}</div>
              <div className="stat-sub">热度最高</div>
            </div>
          </div>
        )}

        {/* Platform Tabs */}
        <div className="tabs">
          {(['all', 'wechat', 'xiaohongshu'] as Platform[]).map((p) => (
            <button
              key={p}
              className={`tab ${platform === p ? 'active' : ''}`}
              onClick={() => handlePlatformChange(p)}
            >
              {platformLabel(p)}
            </button>
          ))}
        </div>

        {/* Recent Items */}
        <div className="item-list">
          {loading ? (
            <div className="empty-state">
              <div className="empty-state-text">加载中...</div>
            </div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <div className="empty-state-text">暂无数据</div>
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
                    <span>❤️ {item.likes}</span>
                    <span>💬 {item.comments}</span>
                    <span>🔗 {item.shares}</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
