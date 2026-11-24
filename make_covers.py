import json, os
from PIL import Image, ImageDraw

covers_dir = "public/reading/assets/covers"
os.makedirs(covers_dir, exist_ok=True)
index_path = "public/reading/stories/index.json"
stories = json.load(open(index_path, encoding="utf-8"))

def draw_cover(title, out_png):
    W, H = 400, 320
    bg = "#FFF3CD"
    kind = "book"
    if "兔" in title: bg, kind = "#FFE5EC", "rabbit"
    elif "鳥" in title: bg, kind = "#E0F2FE", "bird"
    elif "龜" in title: bg, kind = "#DCFCE7", "turtle"
    elif "豬" in title: bg, kind = "#FCE7F3", "pig"
    elif "熊" in title: bg, kind = "#FEF3C7", "bear"
    elif "Star" in title: bg, kind = "#EDE9FE", "star"

    img = Image.new("RGB", (W, H), bg)
    d = ImageDraw.Draw(img)
    # 白色中心光暈圓底
    d.ellipse([105, 55, 295, 245], fill="#FFFFFF")

    if kind == "rabbit":
        d.ellipse([155, 45, 185, 130], fill="#FFFFFF", outline="#FFB3C6", width=4)
        d.ellipse([215, 45, 245, 130], fill="#FFFFFF", outline="#FFB3C6", width=4)
        d.ellipse([163, 60, 177, 120], fill="#FFB3C6")
        d.ellipse([223, 60, 237, 120], fill="#FFB3C6")
        d.ellipse([135, 115, 265, 235], fill="#FFFFFF", outline="#FFB3C6", width=4)
        d.ellipse([172, 155, 184, 167], fill="#333333")
        d.ellipse([216, 155, 228, 167], fill="#333333")
        d.ellipse([192, 178, 208, 190], fill="#FF758F")
    elif kind == "bird":
        d.ellipse([135, 100, 265, 225], fill="#38BDF8")
        d.polygon([(260, 150), (305, 165), (260, 180)], fill="#FBBF24")
        d.ellipse([215, 135, 233, 153], fill="#FFFFFF")
        d.ellipse([220, 140, 228, 148], fill="#1E293B")
        d.pieslice([145, 135, 215, 205], 0, 180, fill="#0284C7")
    elif kind == "turtle":
        d.ellipse([255, 155, 305, 205], fill="#4ADE80")
        d.ellipse([282, 168, 290, 176], fill="#1E293B")
        d.rounded_rectangle([140, 195, 170, 230], radius=8, fill="#4ADE80")
        d.rounded_rectangle([225, 195, 255, 230], radius=8, fill="#4ADE80")
        d.pieslice([125, 115, 265, 255], 180, 360, fill="#16A34A")
    elif kind == "pig":
        d.polygon([(135, 130), (155, 80), (185, 115)], fill="#F472B6")
        d.polygon([(265, 130), (245, 80), (215, 115)], fill="#F472B6")
        d.ellipse([130, 105, 270, 235], fill="#F9A8D4")
        d.ellipse([168, 148, 180, 160], fill="#333333")
        d.ellipse([220, 148, 232, 160], fill="#333333")
        d.ellipse([172, 172, 228, 208], fill="#F472B6")
        d.ellipse([186, 185, 194, 195], fill="#831843")
        d.ellipse([206, 185, 214, 195], fill="#831843")
    elif kind == "bear":
        d.ellipse([125, 85, 175, 135], fill="#B45309")
        d.ellipse([225, 85, 275, 135], fill="#B45309")
        d.ellipse([130, 105, 270, 235], fill="#D97706")
        d.ellipse([168, 165, 232, 215], fill="#FDE68A")
        d.ellipse([168, 148, 180, 160], fill="#1E293B")
        d.ellipse([220, 148, 232, 160], fill="#1E293B")
        d.ellipse([192, 172, 208, 186], fill="#451A03")
    elif kind == "star":
        pts = [(200,70),(224,132),(290,136),(238,176),(255,240),(200,202),(145,240),(162,176),(110,136),(176,132)]
        d.polygon(pts, fill="#FBBF24", outline="#F59E0B")
        d.ellipse([180, 150, 190, 160], fill="#78350F")
        d.ellipse([210, 150, 220, 160], fill="#78350F")
    else:
        d.rounded_rectangle([135, 95, 265, 215], radius=14, fill="#F59E0B")
        d.rounded_rectangle([147, 107, 253, 203], radius=8, fill="#FFFBEB")
        d.line([(200, 107), (200, 203)], fill="#F59E0B", width=6)

    img.save(out_png, "PNG")

for s in stories:
    sid = s["id"]
    png_file = os.path.join(covers_dir, f"{sid}.png")
    draw_cover(s["title"], png_file)
    s["cover"] = f"/reading/assets/covers/{sid}.png?v=1"

with open(index_path, "w", encoding="utf-8") as f:
    json.dump(stories, f, ensure_ascii=False, indent=2)

print("🎉 真實 PNG 彩色插畫封面已全部生成！")
