import sys
force_cov = '--force' in sys.argv
import json, os
from PIL import Image, ImageDraw

covers_dir = "public/reading/assets/covers"
os.makedirs(covers_dir, exist_ok=True)
index_path = "public/reading/stories/index.json"
stories = json.load(open(index_path, encoding="utf-8"))

LEVEL_PALETTE = {
    1: ("#DCFCE7", "#22C55E"),  # 啟蒙級：清新草綠
    2: ("#FEF3C7", "#F59E0B"),  # 進階級：溫暖金黃
    3: ("#E0E7FF", "#6366F1"),  # 挑戰級：智慧靛藍
}

for s in stories:
    if not force_cov and os.path.exists(f"public/reading/stories/{s['id']}/cover.png"):
        continue
    sid = s["id"]
    lvl = s.get("level", 1)
    title = s["titles"]["hk"]
    bg, accent = LEVEL_PALETTE.get(lvl, ("#FFF3CD", "#F59E0B"))

    img = Image.new("RGB", (400, 320), bg)
    d = ImageDraw.Draw(img)
    d.ellipse([100, 60, 300, 260], fill="#FFFFFF")

    # 根據故事主題繪製不同可愛圖示
    if "兔" in title:
        d.ellipse([155, 70, 185, 155], fill="#FFF", outline="#F43F5E", width=4)
        d.ellipse([215, 70, 245, 155], fill="#FFF", outline="#F43F5E", width=4)
        d.ellipse([140, 130, 260, 240], fill="#FFF", outline="#F43F5E", width=4)
        d.ellipse([175, 170, 187, 182], fill="#1E293B")
        d.ellipse([213, 170, 225, 182], fill="#1E293B")
        d.ellipse([193, 192, 207, 202], fill="#F43F5E")
    elif "鴨" in title or "鳥" in title:
        d.ellipse([140, 110, 250, 220], fill="#FACC15")
        d.polygon([(245, 155), (295, 170), (245, 185)], fill="#F97316")
        d.ellipse([210, 140, 224, 154], fill="#1E293B")
    elif "彩虹" in title:
        for r, c in [(95, "#EF4444"), (80, "#F97316"), (65, "#EAB308"), (50, "#22C55E"), (35, "#3B82F6")]:
            d.pieslice([200-r, 210-r, 200+r, 210+r], 180, 360, fill=c)
        d.pieslice([180, 190, 220, 230], 180, 360, fill="#FFFFFF")
    elif "刷牙" in title:
        d.rounded_rectangle([155, 110, 245, 210], radius=24, fill="#38BDF8")
        d.rounded_rectangle([172, 130, 228, 185], radius=12, fill="#FFFFFF")
        d.line([(120, 215), (280, 215)], fill="#F43F5E", width=12)
    elif "龜" in title:
        d.ellipse([255, 170, 295, 205], fill="#22C55E")
        d.pieslice([120, 120, 265, 245], 180, 360, fill="#15803D")
        d.line([(115, 185), (270, 185)], fill="#166534", width=8)
    elif "豬" in title:
        d.ellipse([135, 105, 265, 235], fill="#F9A8D4")
        d.ellipse([178, 165, 222, 198], fill="#F472B6")
        d.ellipse([170, 145, 182, 157], fill="#1E293B")
        d.ellipse([218, 145, 230, 157], fill="#1E293B")
    elif "熊" in title or "松鼠" in title:
        d.ellipse([135, 95, 175, 135], fill="#B45309")
        d.ellipse([225, 95, 265, 135], fill="#B45309")
        d.ellipse([140, 110, 260, 230], fill="#D97706")
        d.ellipse([175, 170, 225, 205], fill="#FEF3C7")
    elif "水滴" in title:
        d.polygon([(200, 85), (150, 175), (250, 175)], fill="#38BDF8")
        d.ellipse([150, 135, 250, 235], fill="#38BDF8")
    elif "月亮" in title:
        d.ellipse([140, 95, 260, 215], fill="#FBBF24")
        d.ellipse([175, 85, 275, 195], fill="#FFFFFF")
    else:
        # 經典故事書徽章
        d.rounded_rectangle([140, 105, 260, 215], radius=14, fill=accent)
        d.rounded_rectangle([150, 115, 250, 205], radius=8, fill="#FFFFFF")
        d.line([(200, 115), (200, 205)], fill=accent, width=6)

    png_file = os.path.join(covers_dir, f"{sid}.png")
    img.save(png_file, "PNG")
    s["cover"] = f"/reading/assets/covers/{sid}.png?v=2"

json.dump(stories, open(index_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(f"🎨 已為全部 {len(stories)} 篇分級故事生成專屬封面！")
