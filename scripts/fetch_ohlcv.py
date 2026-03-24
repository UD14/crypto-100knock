import os
import time
import requests
import zipfile
import io
import pandas as pd
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

# .env.local から接続情報を取得
load_dotenv(".env.local")

URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not URL or not KEY:
    print("Error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local")
    exit(1)

supabase: Client = create_client(URL, KEY)

def fetch_binance_monthly_klines(symbol="BTCUSDT", interval="1h", year="2024", month="01"):
    """
    Binance Public Data (Archived Monthly) からデータを取得する
    APIキー不要、日本からのアクセス制限なし（ファイルダウンロードのみ）
    """
    filename = f"{symbol}-{interval}-{year}-{month:02}"
    base_url = f"https://data.binance.vision/data/spot/monthly/klines/{symbol}/{interval}/{filename}.zip"
    
    print(f"Downloading {filename} from Binance Vision...")
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = requests.get(base_url, timeout=30)
            if response.status_code == 200:
                break
            if response.status_code == 404:
                print(f"File not found: {filename}")
                return []
            print(f"Failed to download {filename}: {response.status_code}")
            return []
        except Exception as e:
            if attempt == max_retries - 1:
                print(f"Error downloading {filename} after {max_retries} attempts: {e}")
                return []
            print(f"Download error, retrying... ({e})")
            time.sleep(2)
        
    # ZIPを展開してCSVを読み込む
    with zipfile.ZipFile(io.BytesIO(response.content)) as z:
        with z.open(f"{filename}.csv") as f:
            # Binance CSV columns: open_time, open, high, low, close, volume, close_time, quote_asset_volume, number_of_trades, taker_buy_base_asset_volume, taker_buy_quote_asset_volume, ignore
            df = pd.read_csv(f, header=None)
            
    formatted_data = []
    for _, row in df.iterrows():
        try:
            # タイムスタンプが大きすぎる場合は秒単位の可能性を疑う
            ts_val = float(row[0])
            if ts_val > 1e11: # 多分ミリ秒
                ts_val /= 1000
            
            ts = datetime.fromtimestamp(ts_val).isoformat()
            formatted_data.append({
                "symbol": symbol.replace("USDT", ""),
                "timeframe": interval,
                "timestamp": ts,
                "open": float(row[1]),
                "high": float(row[2]),
                "low": float(row[3]),
                "close": float(row[4]),
                "volume": float(row[5])
            })
        except Exception as e:
            print(f"  Row skip error: {e}")
            continue
    return formatted_data

def save_to_supabase(data):
    if not data:
        return
        
    print(f"Saving {len(data)} records to Supabase...")
    
    batch_size = 1000
    for i in range(0, len(data), batch_size):
        batch = data[i:i + batch_size]
        try:
            # on_conflictで重複を無視（upsert）
            supabase.table("ohlcv_data").upsert(batch, on_conflict="symbol,timeframe,timestamp").execute()
            print(f"  Uploaded {min(i + batch_size, len(data))}/{len(data)}")
        except Exception as e:
            print(f"  Error in batch {i}: {e}")
        time.sleep(0.1)

if __name__ == "__main__":
    # 2024年の1時間足を数ヶ月分サンプルとして取得
    # 必要に応じて期間を広げてください
    target_months = [
        ("2023", 10), ("2023", 11), # クラッシュ時などの代用
        ("2024", 1), ("2024", 2), ("2024", 4) # 半減期付近
    ]
    
    for year, month in target_months:
        # BTC
        data = fetch_binance_monthly_klines("BTCUSDT", "1h", year, month)
        save_to_supabase(data)
        
        # ETH
        data = fetch_binance_monthly_klines("ETHUSDT", "1h", year, month)
        save_to_supabase(data)

    print("Pipeline finished successfully.")
