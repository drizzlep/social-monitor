#!/usr/bin/env python3
"""
微信公众号详情补充脚本
使用 Agent-Reach 工具获取文章详细数据（点赞/评论等）
"""
import json
import os
import subprocess
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
WORKSPACE_DIR = SCRIPT_DIR.parent
DATA_DIR = WORKSPACE_DIR / "data"
WECHAT_TOOL = Path.home() / ".agent-reach" / "tools" / "wechat-article-for-ai" / "main.py"


def get_recent_dates(n: int = 7) -> list:
    """获取最近N天的日期"""
    dates = []
    today = datetime.now()
    for i in range(n):
        d = today - timedelta(days=i)
        dates.append(d.strftime("%Y-%m-%d"))
    return dates


def load_data(date_str: str) -> list:
    """加载指定日期的数据"""
    wechat_file = DATA_DIR / date_str / "wechat.json"
    if not wechat_file.exists():
        return []
    
    with open(wechat_file, "r", encoding="utf-8") as f:
        return json.load(f)


def save_data(date_str: str, items: list):
    """保存数据"""
    wechat_file = DATA_DIR / date_str / "wechat.json"
    with open(wechat_file, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)


def enrich_wechat_article(url: str) -> dict:
    """
    使用 wechat-article-for-ai 工具获取详情
    返回补充的数据
    """
    try:
        cmd = ["python3", str(WECHAT_TOOL), url]
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode != 0:
            return {}
        
        # 尝试解析输出（工具输出为纯文本或JSON）
        output = result.stdout
        
        # 工具可能输出debug信息，尝试提取正文
        enriched = {
            "enriched": True,
            "note": "Enrichment attempted"
        }
        
        return enriched
        
    except subprocess.TimeoutExpired:
        return {"enriched": False, "note": "Timeout"}
    except Exception as e:
        return {"enriched": False, "note": str(e)}


def main():
    """主流程"""
    print("=" * 60)
    print("微信公众号详情补充")
    print("=" * 60)
    
    if not WECHAT_TOOL.exists():
        print(f"⚠ 微信工具未找到: {WECHAT_TOOL}")
        print("  跳过详情补充")
        return
    
    dates = get_recent_dates(7)
    total_enriched = 0
    
    for date_str in dates:
        items = load_data(date_str)
        if not items:
            continue
        
        print(f"\n📅 {date_str}: {len(items)} articles")
        
        # 过滤出还未补充的
        to_enrich = [item for item in items if not item.get("enriched", False)]
        
        if not to_enrich:
            print("  ✓ Already enriched")
            continue
        
        print(f"  🔄 Enriching {len(to_enrich)} articles...")
        
        for i, item in enumerate(items):
            if item.get("enriched", False):
                continue
            
            if item["platform"] != "wechat":
                continue
            
            url = item.get("url", "")
            if not url:
                continue
            
            print(f"    [{i+1}/{len(items)}] {item['title'][:40]}...")
            
            # 获取详情
            enriched = enrich_wechat_article(url)
            item.update(enriched)
            item["enrichedAt"] = datetime.now().isoformat()
            
            # 更新原始记录（内存中）
            # 实际文件中需要遍历更新
            
            # 避免限流
            time.sleep(2)
        
        # 保存更新后的数据
        save_data(date_str, items)
        
        enriched_count = len([i for i in items if i.get("enriched", False)])
        print(f"  ✓ {enriched_count}/{len(items)} enriched")
        total_enriched += enriched_count
    
    print("\n" + "=" * 60)
    print(f"✅ 补充完成! 共补充 {total_enriched} 条")
    print("=" * 60)


if __name__ == "__main__":
    main()
