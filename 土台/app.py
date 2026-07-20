import os
import streamlit as st

# ページ設定
st.set_page_config(
    page_title="こえログ | 声でわかるストレス傾向チェック",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# 1. 境界線を一切排除し、Streamlitの最背面にオリジナルグラデーションを敷くCSS
st.markdown("""
    <style>
        /* 画面全体にオリジナルの夜空グラデーションを適用し、スクロールを絶対禁止 */
        html, body, [data-testid="stAppViewContainer"], [data-testid="stApp"], .main {
            margin: 0 !important;
            padding: 0 !important;
            background: 
              radial-gradient(circle at 20% 0%, #2A335E 0%, transparent 55%),
              radial-gradient(circle at 85% 15%, #2C2E58 0%, transparent 50%),
              linear-gradient(180deg, #161B33 0%, #10142A 100%) !important;
            overflow: hidden !important; 
            height: 100vh !important;
            width: 100vw !important;
        }
        
        /* コンテナーの余白と幅制限を解除 */
        [data-testid="stAppViewBlockContainer"] {
            max-width: 100% !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
        }
        
        /* ヘッダー・装飾線を非表示 */
        [data-testid="stHeader"], [data-testid="stDecoration"] {
            display: none !important;
        }
        
        /* iframeまわりの枠・背景・スクロールを完全にリセット */
        [data-testid="stHtml"], [data-testid="stCustomComponentV1"] {
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            width: 100% !important;
        }
        
        iframe {
            display: block !important;
            background: transparent !important;
            overflow: hidden !important;
            border: none !important;
            width: 100% !important;
            height: 100vh !important;
        }
    </style>
""", unsafe_allow_html=True)

# ==================== フロント表示 ====================
front_dir = os.path.join(os.path.dirname(__file__), "..", "front")

with open(os.path.join(front_dir, "style.css"), "r", encoding="utf-8") as f:
    css_content = f.read()

with open(os.path.join(front_dir, "script.js"), "r", encoding="utf-8") as f:
    js_content = f.read()

with open(os.path.join(front_dir, "index.html"), "r", encoding="utf-8") as f:
    html_base = f.read()

# HTMLをインライン化（CSSとJSを埋め込む）
html_modified = html_base.replace(
    '<link rel="stylesheet" href="style.css">',
    f"<style>{css_content}</style>"
).replace(
    '<script src="script.js"></script>',
    f"<script>{js_content}</script>"
)

# フロントを表示
st.components.v1.html(
    html_modified, 
    height=1000, 
    scrolling=False, 
    width=None
)

# ==================== バックエンド処理 ====================
# 声の解析やキャラクター生成などを追加したくなったら、ここから再開する