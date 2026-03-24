#!/usr/bin/env python3
"""
社媒情报平台 - 数据收集脚本
使用百度搜索 API 收集微信公众号和小红书内容
"""
import json
import os
import sys
import time
import hashlib
import requests
from datetime import datetime, timedelta
from pathlib import Path

# 路径配置
SCRIPT_DIR = Path(__file__).parent
WORKSPACE_DIR = SCRIPT_DIR.parent
DATA_DIR = WORKSPACE_DIR / "data"
KEYWORDS_FILE = SCRIPT_DIR / "keywords.json"
BAIDU_SEARCH_SCRIPT = Path.home() / ".openclaw" / "workspace" / "skills" / "baidu-search" / "scripts" / "search.py"

# 百度搜索 API Key
BAIDU_API_KEY = os.getenv("BAIDU_API_KEY", "")


def load_keywords():
    """加载关键词配置"""
    with open(KEYWORDS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def md5_id(url: str) -> str:
    """生成短ID"""
    return hashlib.md5(url.encode()).hexdigest()[:12]


def save_results(date_str: str, platform: str, items: list):
    """保存结果到JSON文件"""
    date_dir = DATA_DIR / date_str
    date_dir.mkdir(parents=True, exist_ok=True)
    
    output_file = date_dir / f"{platform}.json"
    
    # 如果文件已存在，合并去重
    existing = []
    if output_file.exists():
        with open(output_file, "r", encoding="utf-8") as f:
            existing = json.load(f)
    
    # 去重
    existing_urls = {item["url"] for item in existing}
    new_items = [item for item in items if item["url"] not in existing_urls]
    
    # 合并
    all_items = existing + new_items
    
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(all_items, f, ensure_ascii=False, indent=2)
    
    print(f"  ✓ {platform}: {len(items)} new, {len(existing)} existing, {len(new_items)} added")
    return len(new_items)


def search_baidu(keyword: str, count: int = 20) -> list:
    """使用百度搜索 API"""
    if not BAIDU_API_KEY:
        print(f"  ⚠ BAIDU_API_KEY not set, skipping search")
        return []
    
    url = "https://qianfan.baidubce.com/v2/ai_search/web_search"
    
    headers = {
        "Authorization": f"Bearer {BAIDU_API_KEY}",
        "X-Appbuilder-From": "openclaw",
        "Content-Type": "application/json"
    }
    
    request_body = {
        "messages": [{"content": keyword, "role": "user"}],
        "search_source": "baidu_search_v2",
        "resource_type_filter": [{"type": "web", "top_k": count}],
        "search_filter": {}
    }
    
    try:
        response = requests.post(url, json=request_body, headers=headers, timeout=30)
        response.raise_for_status()
        results = response.json()
        
        if "code" in results:
            print(f"  ⚠ API error: {results.get('message', 'unknown')}")
            return []
        
        items = []
        for ref in results.get("references", []):
            item = parse_result(ref, keyword)
            if item:
                items.append(item)
        
        return items
    except Exception as e:
        print(f"  ⚠ Search failed: {e}")
        return []


def parse_result(ref: dict, keyword: str) -> dict:
    """解析单条搜索结果"""
    url = ref.get("url", "")
    if not url:
        return None
    
    # 判断平台
    platform = "web"
    if "mp.weixin.qq.com" in url:
        platform = "wechat"
    elif "xiaohongshu.com" in url or "xhslink.com" in url:
        platform = "xiaohongshu"
    
    # 提取日期
    date_str = ref.get("date", "")
    try:
        if date_str:
            published_at = datetime.strptime(date_str.split(" ")[0], "%Y-%m-%d").isoformat()
        else:
            published_at = datetime.now().isoformat()
    except:
        published_at = datetime.now().isoformat()
    
    # 检测品牌
    brand = detect_brand(ref.get("title", "") + " " + ref.get("content", ""))
    
    # 摘要
    content = ref.get("content", "")[:300]
    
    return {
        "id": f"{platform}_{md5_id(url)}",
        "platform": platform,
        "title": ref.get("title", "Untitled"),
        "author": ref.get("website", ""),
        "publishedAt": published_at,
        "url": url,
        "summary": content,
        "likes": 0,
        "comments": 0,
        "collectors": 0,
        "keywords": [keyword],
        "brand": brand,
        "fetchedAt": datetime.now().isoformat()
    }


def detect_brand(text: str) -> str:
    """检测文本中提到的品牌"""
    keywords = load_keywords()
    brands = keywords.get("brand", [])
    
    for brand in brands:
        if brand in text:
            return brand
    return None


def collect_keyword(keyword: str) -> tuple:
    """收集单个关键词"""
    print(f"\n🔍 Searching: {keyword}")
    
    items = search_baidu(keyword)
    
    wechat_items = [item for item in items if item["platform"] == "wechat"]
    xiaohongshu_items = [item for item in items if item["platform"] == "xiaohongshu"]
    web_items = [item for item in items if item["platform"] == "web"]
    
    return wechat_items, xiaohongshu_items, web_items


def main():
    """主流程"""
    print("=" * 60)
    print("社媒情报平台 - 数据收集")
    print("=" * 60)
    
    # 加载关键词
    keywords = load_keywords()
    all_keywords = (
        keywords.get("brand", []) +
        keywords.get("industry", []) +
        keywords.get("demand", []) +
        keywords.get("social_style", [])
    )
    
    print(f"\n📊 Loaded {len(all_keywords)} keywords")
    
    # 创建日期目录
    date_str = datetime.now().strftime("%Y-%m-%d")
    date_dir = DATA_DIR / date_str
    date_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"\n📅 Date: {date_str}")
    
    total_wechat = 0
    total_xiaohongshu = 0
    total_web = 0
    
    # 逐个关键词搜索
    for i, keyword in enumerate(all_keywords):
        print(f"\n[{i+1}/{len(all_keywords)}]", end="")
        
        wechat, xiaohongshu, web = collect_keyword(keyword)
        
        # 保存
        if wechat:
            n = save_results(date_str, "wechat", wechat)
            total_wechat += n
        if xiaohongshu:
            n = save_results(date_str, "xiaohongshu", xiaohongshu)
            total_xiaohongshu += n
        if web:
            n = save_results(date_str, "web", web)
            total_web += n
        
        # 避免限流
        if i < len(all_keywords) - 1:
            time.sleep(1)
    
    # 统计
    print("\n" + "=" * 60)
    print("✅ 收集完成!")
    print(f"   微信公众号: {total_wechat} 条")
    print(f"   小红书: {total_xiaohongshu} 条")
    print(f"   网页: {total_web} 条")
    print(f"   数据目录: {date_dir}")
    print("=" * 60)
    
    return {
        "date": date_str,
        "wechat": total_wechat,
        "xiaohongshu": total_xiaohongshu,
        "web": total_web
    }


if __name__ == "__main__":
    result = main()
    sys.exit(0)
