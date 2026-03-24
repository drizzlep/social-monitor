'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { fetchItems, platformBadgeClass, type SocialItem } from '@/lib/data'

function getDateStr(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().split('T')[0]
}

const PLATFORM_COLORS: Record<string, { bg: string; label: string }> = {
  wechat:      { bg: 'rgba(7,193,96,0.7)',   label: '微信公众号' },
  xiaohongshu: { bg: 'rgba(254,44,85,0.7)',  label: '小红书' },
  zhihu:       { bg: 'rgba(0,132,255,0.7)',  label: '知乎' },
  weibo:       { bg: 'rgba(230,22,45,0.7)',  label: '微博' },
  douyin:      { bg: 'rgba(0,0,0,0.5)',      label: '抖音' },
  bilibili:    { bg: 'rgba(0,161,214,0.7)',  label: 'B站' },
  web:         { bg: 'rgba(139,90,43,0.5)',  label: '其他' },
}

export default function TrendsPage() {
  const [dailyData, setDailyData] = useState<Record<string, Record<string, number>>>({})
  const [brandData, setBrandData] = useState<Record<string, number>>({})
  const [topItems, setTopItems] = useState<SocialItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const today = getDateStr(0)
      const platforms = Object.keys(PLATFORM_COLORS)

      // Fetch last 14 days for all platforms
      const items: SocialItem[] = []
      for (let i = 0; i < 14; i++) {
        const date = getDateStr(i)
        try {
          const results = await Promise.all(
            platforms.map(p => fetch(`/data/${date}/${p}.json`).then(r => r.ok ? r.json() : []).catch(() => []))
          )
          for (const platformItems of results) {
            items.push(...platformItems)
          }
        } catch {
          // skip
        }
      }

      // Daily counts per platform
      const daily: Record<string, Record<string, number>> = {}
      for (let i = 0; i < 14; i++) {
        const date = getDateStr(i)
        daily[date] = {}
        for (const p of platforms) daily[date][p] = 0
      }
      for (const item of items) {
        const date = item.date
        if (daily[date] && daily[date][item.platform] !== undefined) {
          daily[date][item.platform]++
        }
      }
      setDailyData(daily)

      // Brand counts
      const brands: Record<string, number> = {}
      for (const item of items) {
        if (item.brand) {
          brands[item.brand] = (brands[item.brand] || 0) + 1
        }
      }
      const sortedBrands = Object.entries(brands).sort((a, b) => b[1] - a[1]).slice(0, 10)
      setBrandData(Object.fromEntries(sortedBrands))

      // Top by likes
      const sorted = [...items].sort((a, b) => b.likes - a.likes).slice(0, 10)
      setTopItems(sorted)

      setLoading(false)
    }
    load()
  }, [])

  const maxDaily = Math.max(...Object.values(dailyData).flatMap(d => Object.values(d).concat([1])), 1)

  return (
    <div>
      <header className="header">
        <div className="header-inner">
          <Link href="/" className="logo">良禽佳木 · 社交监测</Link>
          <nav className="nav">
            <Link href="/">数据概览</Link>
            <Link href="/search">搜索</Link>
            <Link href="/trends" className="active">趋势</Link>
          </nav>
        </div>
      </header>

      <main className="page">
        <h1 className="page-title">热度趋势</h1>

        {loading ? (
          <div className="empty-state"><div className="empty-state-text">加载中...</div></div>
        ) : (
          <>
            {/* Daily Bar Chart */}
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '24px', marginBottom: '32px', boxShadow: 'var(--shadow)' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px', color: 'var(--color-text)' }}>每日内容发布量</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(dailyData).reverse().map(([date, counts]) => {
                  const total = Object.values(counts).reduce((a, b) => a + b, 0)
                  const activePlatforms = Object.entries(counts).filter(([, v]) => v > 0)
                  return (
                    <div key={date} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', width: '80px', flexShrink: 0 }}>{date}</span>
                      <div style={{ flex: 1, display: 'flex', gap: '2px', alignItems: 'center' }}>
                        {activePlatforms.length === 0 ? (
                          <div style={{ height: '20px', width: '4px', background: '#eee', borderRadius: '2px' }} />
                        ) : (
                          activePlatforms.map(([p, v]) => {
                            const w = total > 0 ? (v / total) * 100 : 0
                            return (
                              <div key={p} style={{ width: `${w}%`, height: '20px', background: PLATFORM_COLORS[p]?.bg || '#ccc', borderRadius: '3px', minWidth: '2px' }} title={`${PLATFORM_COLORS[p]?.label || p} ${v}`} />
                            )
                          })
                        )}
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', width: '40px', textAlign: 'right' }}>{total}</span>
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '12px', flexWrap: 'wrap' }}>
                {Object.entries(PLATFORM_COLORS).map(([p, { bg, label }]) => (
                  <span key={p} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: bg }} />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
              {/* Brand Ranking */}
              <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '24px', boxShadow: 'var(--shadow)' }}>
                <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'var(--color-text)' }}>品牌提及排行</div>
                {Object.entries(brandData).length === 0 ? (
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>暂无数据</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {Object.entries(brandData).map(([brand, count], i) => (
                      <div key={brand} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: i < 3 ? 'var(--color-accent)' : 'var(--color-text-secondary)', width: '20px' }}>#{i + 1}</span>
                        <span style={{ fontSize: '14px', flex: 1, color: 'var(--color-text)' }}>{brand}</span>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{count} 条</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Items */}
              <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '24px', boxShadow: 'var(--shadow)' }}>
                <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'var(--color-text)' }}>点赞TOP10</div>
                {topItems.length === 0 ? (
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>暂无数据</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {topItems.map((item, i) => (
                      <Link key={item.id} href={`/detail/${item.id}`} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', textDecoration: 'none' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: i < 3 ? 'var(--color-accent)' : 'var(--color-text-secondary)', flexShrink: 0, width: '16px' }}>#{i + 1}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>❤️ {item.likes.toLocaleString()} · {item.platform === 'wechat' ? '公众号' : '小红书'}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
