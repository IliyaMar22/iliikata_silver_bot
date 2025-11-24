#!/usr/bin/env python3
"""Quick test of silver scraping"""
import asyncio
from silver_data_sources import SilverMarketDataService

async def main():
    service = SilverMarketDataService()
    result = await service.fetch_spot_prices()
    print(f"\n✅ Scraped {len(result.get('sources', []))} source(s)")
    if result.get('average'):
        print(f"📊 Average price: ${result['average']:.2f}")
    for source in result.get('sources', []):
        print(f"  • {source['source']}: ${source['price']:.2f}")

if __name__ == "__main__":
    asyncio.run(main())


