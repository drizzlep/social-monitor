'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { fetchItemById, platformBadgeClass, type SocialItem } from '@/lib/data'

export default function DetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [item, setItem] = useState<SocialItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [id, setId] = useState<string>('')

  useEffect(() => {
    params.then((p) => {
      setId(p.id)
      fetchItemById(p.id).then((data) => {
        setItem(data)
        setLoading(false)
      })
    })
  }, [params])

  if (loading) {
    return (
      <div>
        <header className="header">
          <div className="header-inner">
            <Link href="/" className="logo">良禽佳木 · 社交监测</Link>
            <nav className="nav">
              <Link href="/">数据概览</Link>
              <Link href="/search">搜索</Link>
            </nav>
          </div>
        </header>
        <main className="detail-page">
          <div className="empty-state">加载中...</div>
        </main>
      </div>
    )
  }

  if (!item) {
    return (
      <div>
        <header className="header">
          <div className="header-inner">
            <Link href="/" className="logo">良禽佳木 · 社交监测</Link>
            <nav className="nav">
              <Link href="/">数据概览</Link>
              <Link href="/search">搜索</Link>
            </nav>
          </div>
        </header>
        <main className="detail-page">
          <Link href="/search" className="back-link">← 返回搜索</Link>
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-text">内容不存在或已被删除</div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div>
      <header className="header">
        <div className="header-inner">
          <Link href="/" className="logo">良禽佳木 · 社交监测</Link>
          <nav className="nav">
            <Link href="/">数据概览</Link>
            <Link href="/search">搜索</Link>
          </nav>
        </div>
      </header>

      <main className="detail-page">
        <Link href="/search" className="back-link">← 返回搜索</Link>

        <div className="detail-card">
          <div className="detail-meta">
            <span className={platformBadgeClass(item.platform)}>
              {item.platform === 'wechat' ? '微信公众号' : '小红书'}
            </span>
            {item.brand && <span className="badge badge-tag">{item.brand}</span>}
            {item.tags?.map((tag) => (
              <span key={tag} className="badge badge-tag">{tag}</span>
            ))}
          </div>

          <h1 className="detail-title">{item.title}</h1>

          <div className="item-meta" style={{ marginBottom: '24px' }}>
            <span>👤 {item.author}</span>
            <span>📅 {item.date}</span>
            <span>❤️ {item.likes.toLocaleString()}</span>
            <span>💬 {item.comments.toLocaleString()}</span>
            <span>🔗 {item.shares.toLocaleString()}</span>
          </div>

          <div className="detail-content">{item.content}</div>

          <div className="detail-section">
            <div className="detail-section-title">详细信息</div>
            <div className="detail-fields">
              <div className="detail-field">
                <div className="detail-field-label">平台</div>
                <div className="detail-field-value">
                  {item.platform === 'wechat' ? '微信公众号' : '小红书'}
                </div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">作者</div>
                <div className="detail-field-value">{item.author}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">发布日期</div>
                <div className="detail-field-value">{item.date}</div>
              </div>
              {item.brand && (
                <div className="detail-field">
                  <div className="detail-field-label">品牌</div>
                  <div className="detail-field-value">{item.brand}</div>
                </div>
              )}
              {item.keyword && (
                <div className="detail-field">
                  <div className="detail-field-label">关键词</div>
                  <div className="detail-field-value">{item.keyword}</div>
                </div>
              )}
              <div className="detail-field">
                <div className="detail-field-label">点赞数</div>
                <div className="detail-field-value">{item.likes.toLocaleString()}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">评论数</div>
                <div className="detail-field-value">{item.comments.toLocaleString()}</div>
              </div>
              <div className="detail-field">
                <div className="detail-field-label">分享数</div>
                <div className="detail-field-value">{item.shares.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <a href={item.url} target="_blank" rel="noopener noreferrer" className="original-link">
            🔗 打开原文
          </a>
        </div>
      </main>
    </div>
  )
}
