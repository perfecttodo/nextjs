import asyncio, glob, json, os, re, shutil, subprocess, tempfile, wave, edge_tts, jieba
import numpy as np
from pathlib import Path

# 1. 載入繁體大詞庫與自訂詞典（不再做簡繁轉換，避免「隻/只」混淆）
if os.path.exists("raw_stories/dict.txt.big"):
    jieba.set_dictionary("raw_stories/dict.txt.big")
if os.path.exists("raw_stories/custom_dict.txt"):
    for line in open("raw_stories/custom_dict.txt", encoding="utf-8"):
        w = line.strip()
        if w:
            jieba.add_word(w, freq=20000)

PUNCT_ONLY = re.compile(r'^[\s\W_]+$', re.UNICODE)
EN_SPLIT = re.compile(r'([A-Za-z0-9\']+|[^\w\s])')
NUM_MEASURE = re.compile(r'^[一二三四五六七八九十兩幾這那每][隻個條對雙棵朵張本件位只]$')

LANG_MAP = {
    "_hk": ("zh-HK", "粵語", "zh-HK-HiuGaaiNeural"),
    "_tw": ("zh-TW", "國語", "zh-TW-HsiaoChenNeural"),
    "_cn": ("zh-CN", "普通話", "zh-CN-XiaoxiaoNeural"),
    "_en": ("en-US", "English", "en-US-AnaNeural"),
}

def detect_lang(stem, text):
    for suffix, cfg in LANG_MAP.items():
        if stem.endswith(suffix):
            return stem[:-len(suffix)], cfg
    if re.fullmatch(r'[\x00-\x7F]+', text.strip()):
        return stem, LANG_MAP["_en"]
    return stem, LANG_MAP["_hk"]

def tokenize_story(text, lang):
    """支援手動 '|' 分隔符 + 繁體原生分詞 + 數詞量詞自動合併"""
    if lang.startswith("en"):
        return [t for t in EN_SPLIT.findall(text.replace("|", " ")) if t.strip()]

    tokens = []
    # 先按手動分隔符 '|' 切開，尊重人工指定邊界
    for manual_chunk in text.split("|"):
        for seg in re.split(r'([^\u4e00-\u9fff]+)', manual_chunk):
            if not seg.strip():
                continue
            if re.match(r'^[\u4e00-\u9fff]+$', seg):
                raw_cuts = list(jieba.cut(seg))
                # 合併被拆開的「數詞 + 量詞」（例如「一」+「隻」 -> 「一隻」）
                i = 0
                while i < len(raw_cuts):
                    if i + 1 < len(raw_cuts) and NUM_MEASURE.match(raw_cuts[i] + raw_cuts[i + 1]):
                        tokens.append(raw_cuts[i] + raw_cuts[i + 1])
                        i += 2
                    else:
                        tokens.append(raw_cuts[i])
                        i += 1
            else:
                for ch in seg:
                    if ch.strip():
                        tokens.append(ch)
    return tokens

async def synth_and_trim_word(word, voice, out_wav, sr=24000):
    tmp_mp3 = out_wav + ".mp3"
    comm = edge_tts.Communicate(word, voice, rate="-10%")
    await comm.save(tmp_mp3)

    cmd = ["ffmpeg", "-y", "-i", tmp_mp3, "-f", "s16le", "-ac", "1", "-acodec", "pcm_s16le", "-ar", str(sr), "-"]
    pcm = subprocess.run(cmd, capture_output=True, check=True).stdout
    os.remove(tmp_mp3)
    samples = np.frombuffer(pcm, dtype=np.int16)

    hop = int(sr * 0.005)
    trim_start, trim_end = 0, len(samples)
    thresh = np.max(np.abs(samples)) * 0.04 if len(samples) > 0 else 0

    for i in range(0, len(samples) - hop, hop):
        if np.max(np.abs(samples[i:i+hop])) > thresh:
            trim_start = max(0, i - int(sr * 0.015))
            break
    for i in range(len(samples) - hop, 0, -hop):
        if np.max(np.abs(samples[i:i+hop])) > thresh:
            trim_end = min(len(samples), i + hop + int(sr * 0.02))
            break

    trimmed = samples[trim_start:trim_end]
    with wave.open(out_wav, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(trimmed.tobytes())

    return len(trimmed) / float(sr)

def make_silence_wav(dur_sec, out_wav, sr=24000):
    n_samples = int(round(dur_sec * sr))
    with wave.open(out_wav, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(np.zeros(n_samples, dtype=np.int16).tobytes())
    return n_samples / float(sr)

def generate_cover_svg(sid, title):
    themes = [
        ("兔", "#FFE5EC", "🐰"), ("鳥", "#E0F2FE", "🐦"), ("龜", "#DCFCE7", "🐢"),
        ("豬", "#FCE7F3", "🐷"), ("熊", "#FEF3C7", "🐻"), ("Star", "#EDE9FE", "⭐"),
    ]
    bg, emoji = "#FFF3CD", "📖"
    for kw, c_bg, c_em in themes:
        if kw in title:
            bg, emoji = c_bg, c_em
            break
    svg_path = f"public/reading/assets/covers/{sid}.svg"
    svg_xml = f'<svg xmlns="http://w3.org" viewBox="0 0 200 160"><rect width="200" height="160" rx="20" fill="{bg}"/><circle cx="100" cy="72" r="46" fill="#ffffff" opacity="0.75"/><text x="100" y="92" font-size="60" text-anchor="middle">{emoji}</text></svg>'
    open(svg_path, "w", encoding="utf-8").write(svg_xml)
    return f"./assets/covers/{sid}.svg"

async def process_file(idx, fp):
    stem = Path(fp).stem
    raw = open(fp, encoding="utf-8").read().strip()
    title, (lang, label, voice) = detect_lang(stem, raw)
    sid = f"story_{idx:03d}"
    final_mp3 = f"public/reading/assets/audio/{sid}.mp3"

    paragraphs = [p.strip() for p in raw.split("\n") if p.strip()]
    tmp_dir = tempfile.mkdtemp()
    wav_list = []
    final_tokens = []
    cur_time = 0.0
    step_idx = 0

    print(f"✨ 正在生成繁體/粵語精準詞組故事: {title}...")

    sil_init = os.path.join(tmp_dir, f"w_{step_idx:04d}.wav")
    cur_time += make_silence_wav(0.1, sil_init)
    wav_list.append(sil_init)
    step_idx += 1

    for p_idx, para in enumerate(paragraphs):
        if p_idx > 0:
            final_tokens.append({"isBreak": True})
            sil_para = os.path.join(tmp_dir, f"w_{step_idx:04d}.wav")
            cur_time += make_silence_wav(0.55, sil_para)
            wav_list.append(sil_para)
            step_idx += 1

        toks = tokenize_story(para, lang)
        for tok in toks:
            if PUNCT_ONLY.match(tok):
                pause_dur = 0.42 if tok in "。！？!?" else 0.25
                sil_p = os.path.join(tmp_dir, f"w_{step_idx:04d}.wav")
                real_p = make_silence_wav(pause_dur, sil_p)
                wav_list.append(sil_p)
                step_idx += 1
                final_tokens.append({"text": tok, "start": round(cur_time, 3), "end": round(cur_time + real_p, 3), "isPunct": True})
                cur_time += real_p
            else:
                w_wav = os.path.join(tmp_dir, f"w_{step_idx:04d}.wav")
                dur = await synth_and_trim_word(tok, voice, w_wav)
                wav_list.append(w_wav)
                step_idx += 1

                final_tokens.append({
                    "text": tok,
                    "start": round(cur_time, 3),
                    "end": round(cur_time + dur, 3),
                    "isPunct": False
                })
                cur_time += dur

                sil_gap = os.path.join(tmp_dir, f"w_{step_idx:04d}.wav")
                cur_time += make_silence_wav(0.035, sil_gap)
                wav_list.append(sil_gap)
                step_idx += 1

    concat_txt = os.path.join(tmp_dir, "concat.txt")
    with open(concat_txt, "w") as lf:
        for w in wav_list:
            lf.write(f"file '{w}'\n")
    subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_txt, "-c:a", "libmp3lame", "-b:a", "128k", final_mp3],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    shutil.rmtree(tmp_dir, ignore_errors=True)

    with open(f"public/reading/stories/{sid}.json", "w", encoding="utf-8") as f:
        json.dump({
            "id": sid, "title": title, "lang": lang,
            "text": "\n\n".join(p.replace("|", "") for p in paragraphs),
            "audioUrl": f"./assets/audio/{sid}.mp3",
            "tokens": final_tokens
        }, f, ensure_ascii=False, indent=2)

    cover_url = generate_cover_svg(sid, title)
    return {"id": sid, "title": title, "lang": lang, "langLabel": label, "cover": cover_url}

async def main():
    files = sorted(glob.glob("raw_stories/txt/*.txt"))
    index = [await process_file(i + 1, f) for i, f in enumerate(files)]
    with open("public/reading/stories/index.json", "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
    print("🎉 繁體/粵語精準分詞生成完成！")

asyncio.run(main())
