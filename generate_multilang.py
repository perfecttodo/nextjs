import sys
import asyncio, hashlib, json, os, re, shutil, subprocess, tempfile, wave, edge_tts, jieba
import numpy as np
from opencc import OpenCC
from PIL import Image, ImageDraw

if os.path.exists("raw_stories/dict.txt.big"): jieba.set_dictionary("raw_stories/dict.txt.big")
if os.path.exists("raw_stories/custom_dict.txt"):
    for line in open("raw_stories/custom_dict.txt", encoding="utf-8"):
        if line.strip(): jieba.add_word(line.strip(), freq=20000)

cc_hk = OpenCC('t2hk')  # 港澳繁體
cc_tw = OpenCC('t2tw')  # 台灣正體
class CnConv:
    def __init__(self): self.cc = OpenCC('t2s')
    def convert(self, t): return self.cc.convert(t).replace('牠', '它')
cc_cn = CnConv()   # 簡體中文

PUNCT_ONLY = re.compile(r'^[\s\W_]+$', re.UNICODE)
EN_SPLIT = re.compile(r'([A-Za-z0-9\']+|[^\w\s])')
NUM_MEASURE = re.compile(r'^[一二三四五六七八九十兩幾這那每][隻個條對雙棵朵張本件位只]$')

VOICES = {
    "hk": ("zh-HK", "zh-HK-HiuGaaiNeural"),
    "tw": ("zh-TW", "zh-TW-HsiaoChenNeural"),
    "cn": ("zh-CN", "zh-CN-XiaoxiaoNeural"),
    "en": ("en-US", "en-US-AnaNeural"),
}

def tokenize_zh(text):
    tokens = []
    # 若包含人工預分詞分隔符 '|'，嚴格按人工標記邊界切分（標點符號自動獨立分離）
    if '|' in text:
        for chunk in text.split('|'):
            for seg in re.split(r'([^\u4e00-\u9fff]+)', chunk):
                if not seg.strip(): continue
                if re.match(r'^[\u4e00-\u9fff]+$', seg):
                    tokens.append(seg)
                else:
                    for ch in seg:
                        if ch.strip(): tokens.append(ch)
        return tokens

    for seg in re.split(r'([^\u4e00-\u9fff]+)', text):
        if not seg.strip(): continue
        if re.match(r'^[\u4e00-\u9fff]+$', seg):
            cuts, i = list(jieba.cut(seg)), 0
            while i < len(cuts):
                if i + 1 < len(cuts) and NUM_MEASURE.match(cuts[i] + cuts[i+1]): tokens.append(cuts[i] + cuts[i+1]); i += 2
                else: tokens.append(cuts[i]); i += 1
        else:
            for ch in seg:
                if ch.strip(): tokens.append(ch)
    return tokens

async def ensure_word_audio(word, voice, words_dir):
    key = hashlib.md5(f"{voice}:{word}".encode("utf-8")).hexdigest()[:12]
    out_mp3 = os.path.join(words_dir, f"{key}.mp3")
    try:
        try:
            try:
                if os.path.exists(out_mp3) and os.path.getsize(out_mp3) < 100: os.remove(out_mp3)
            except FileNotFoundError:
                pass
        except FileNotFoundError:
            pass
    except FileNotFoundError:
        pass
    if not os.path.exists(out_mp3):
        for _ in range(3):
            try:
                await edge_tts.Communicate(word, voice, rate="-10%").save(out_mp3)
                if os.path.exists(out_mp3) and os.path.getsize(out_mp3) > 100: break
            except Exception: await asyncio.sleep(0.4)
    return out_mp3, f"./assets/words/{key}.mp3"

def make_silence_wav(dur_sec, out_wav, sr=24000):
    n = int(round(dur_sec * sr))
    with wave.open(out_wav, "wb") as wf:
        wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(sr); wf.writeframes(np.zeros(n, dtype=np.int16).tobytes())
    return n / float(sr)

def trim_mp3_to_wav(mp3_path, out_wav, sr=24000):
    if not os.path.exists(mp3_path) or os.path.getsize(mp3_path) < 100: return make_silence_wav(0.2, out_wav, sr)
    res = subprocess.run(["ffmpeg", "-y", "-i", mp3_path, "-f", "s16le", "-ac", "1", "-acodec", "pcm_s16le", "-ar", str(sr), "-"], capture_output=True)
    if res.returncode != 0 or not res.stdout: return make_silence_wav(0.2, out_wav, sr)
    samples = np.frombuffer(res.stdout, dtype=np.int16)
    hop, trim_st, trim_ed = int(sr * 0.005), 0, len(samples)
    thresh = np.max(np.abs(samples)) * 0.04 if len(samples) > 0 else 0
    for i in range(0, len(samples) - hop, hop):
        if np.max(np.abs(samples[i:i+hop])) > thresh: trim_st = max(0, i - int(sr * 0.015)); break
    for i in range(len(samples) - hop, 0, -hop):
        if np.max(np.abs(samples[i:i+hop])) > thresh: trim_ed = min(len(samples), i + hop + int(sr * 0.02)); break
    trimmed = samples[trim_st:trim_ed]
    with wave.open(out_wav, "wb") as wf:
        wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(sr); wf.writeframes(trimmed.tobytes())
    return len(trimmed) / float(sr)

async def build_track(sid, lang_key, paragraphs, words_dir):
    bcp47, voice = VOICES[lang_key]
    fluent_mp3 = f"public/reading/assets/audio/{sid}_{lang_key}.mp3"
    exact_mp3 = f"public/reading/assets/audio/{sid}_{lang_key}_exact.mp3"

    # 1. 生成流暢整篇語音（若為簡體或台灣正體，餵給對應語音引擎的標準字形）
    tts_paras = [cc_cn.convert(p.replace("|", "")) if lang_key == "cn" else (cc_tw.convert(p) if lang_key == "tw" else (cc_hk.convert(p) if lang_key == "hk" else p)) for p in paragraphs]
    await edge_tts.Communicate("\n".join(tts_paras), voice, rate="-12%").save(fluent_mp3)

    # 計算整篇流暢音軌總長度供句級均勻分布
    res = subprocess.run(["ffmpeg", "-i", fluent_mp3, "-f", "null", "-"], capture_output=True, text=True)
    total_f_dur = 10.0
    m = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", res.stderr)
    if m: total_f_dur = int(m.group(1))*3600 + int(m.group(2))*60 + float(m.group(3))

    tmp_dir, wav_list, tokens, exact_t, step_i = tempfile.mkdtemp(), [], [], 0.0, 0
    w_init = os.path.join(tmp_dir, f"s_{step_i:04d}.wav"); exact_t += make_silence_wav(0.1, w_init); wav_list.append(w_init); step_i += 1

    all_raw_toks = []
    for p_idx, para in enumerate(paragraphs):
        if p_idx > 0: all_raw_toks.append({"isBreak": True})
        toks = [t for t in EN_SPLIT.findall(para) if t.strip()] if lang_key == "en" else tokenize_zh(para)
        for t in toks: all_raw_toks.append({"text": t, "isPunct": bool(PUNCT_ONLY.match(t))})

    readable_cnt = sum(1 for x in all_raw_toks if not x.get("isBreak") and not x.get("isPunct")) or 1
    f_step = max(0.15, (total_f_dur - 0.3) / readable_cnt)
    f_ptr = 0.15

    for idx_item, item in enumerate(all_raw_toks):
        if item.get("isBreak"):
            tokens.append({"isBreak": True})
            w_p = os.path.join(tmp_dir, f"s_{step_i:04d}.wav"); exact_t += make_silence_wav(0.5, w_p); wav_list.append(w_p); step_i += 1
            f_ptr += 0.2
            continue
        tok = item["text"]
        if item["isPunct"]:
            w_p = os.path.join(tmp_dir, f"s_{step_i:04d}.wav"); real_p = make_silence_wav(0.4 if tok in "。！？!?" else 0.22, w_p); wav_list.append(w_p); step_i += 1
            tokens.append({"text": tok, "text_hk": tok, "text_tw": tok, "text_cn": tok, "isPunct": True, "start": round(f_ptr, 3), "end": round(f_ptr + 0.05, 3), "exactStart": round(exact_t, 3), "exactEnd": round(exact_t + real_p, 3)})
            exact_t += real_p
        else:
            if lang_key == "en":
                if tok == "a":
                    speak_word = "uh"
                elif tok.lower() == "the":
                    # 尋找下一個實體單詞，判斷是否為母音開頭
                    next_w = next((x["text"] for x in all_raw_toks[idx_item + 1:] if not x.get("isBreak") and not x.get("isPunct")), "")
                    speak_word = "thee" if next_w[:1].lower() in "aeiou" else "thuh"
                else:
                    speak_word = tok
            else:
                speak_word = cc_cn.convert(tok) if lang_key == "cn" else (cc_tw.convert(tok) if lang_key == "tw" else cc_hk.convert(tok))
            w_mp3_local, w_mp3_url = await ensure_word_audio(speak_word, voice, words_dir)
            w_wav = os.path.join(tmp_dir, f"s_{step_i:04d}.wav"); dur = trim_mp3_to_wav(w_mp3_local, w_wav); wav_list.append(w_wav); step_i += 1
            tokens.append({
                "text": tok,
                "text_hk": cc_hk.convert(tok) if lang_key != "en" else tok,
                "text_tw": cc_tw.convert(tok) if lang_key != "en" else tok,
                "text_cn": cc_cn.convert(tok) if lang_key != "en" else tok,
                "isPunct": False, "wordAudio": w_mp3_url,
                "start": round(f_ptr, 3), "end": round(f_ptr + f_step, 3),
                "exactStart": round(exact_t, 3), "exactEnd": round(exact_t + dur, 3)
            })
            f_ptr += f_step; exact_t += dur
            w_gap = os.path.join(tmp_dir, f"s_{step_i:04d}.wav"); exact_t += make_silence_wav(0.03, w_gap); wav_list.append(w_gap); step_i += 1

    concat_txt = os.path.join(tmp_dir, "concat.txt")
    open(concat_txt, "w").write("".join(f"file '{w}'\n" for w in wav_list))
    subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_txt, "-c:a", "libmp3lame", "-b:a", "128k", exact_mp3], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    shutil.rmtree(tmp_dir, ignore_errors=True)
    return {"lang": bcp47, "audioUrl": f"./assets/audio/{sid}_{lang_key}.mp3", "exactAudioUrl": f"./assets/audio/{sid}_{lang_key}_exact.mp3", "tokens": tokens}

async def main():
    os.makedirs("public/reading/assets/words", exist_ok=True)
    os.makedirs("public/reading/assets/audio", exist_ok=True)
    os.makedirs("public/reading/stories", exist_ok=True)
    raw_list = json.load(open("raw_stories/bilingual/stories.json", encoding="utf-8"))
    index = []
    target_ids = {a for a in sys.argv[1:] if not a.startswith('--')}
    force_rebuild = '--force' in sys.argv
    target_ids = {a for a in sys.argv[1:] if not a.startswith('--')}
    force_rebuild = '--force' in sys.argv
    for item in raw_list:
        sid = item["id"]
        s_dir = os.path.join("public/reading/stories", sid)
        meta_path = os.path.join(s_dir, "meta.json")
        if target_ids and sid not in target_ids:
            if os.path.exists(meta_path):
                old_m = json.load(open(meta_path, encoding="utf-8"))
                index_list.append({"id": sid, "level": old_m.get("level", 1), "titles": old_m["titles"], "cover": f"./stories/{sid}/cover.png"})
            continue
        story_hash = hashlib.md5(json.dumps(item, sort_keys=True, ensure_ascii=False).encode("utf-8")).hexdigest()
        all_ok = all(os.path.exists(os.path.join(s_dir, f"{k}.wav")) for k in ["hk", "tw", "cn", "en"])
        if not target_ids and not force_rebuild and os.path.exists(meta_path) and all_ok:
            old_m = json.load(open(meta_path, encoding="utf-8"))
            print(f"⚡ 已存在，自動跳過：{sid} {item['title_zh'].replace('|', '')}")
            index_list.append({"id": sid, "level": old_m.get("level", 1), "titles": old_m["titles"], "cover": f"./stories/{sid}/cover.png"})
            continue
        s_dir = os.path.join("public/reading/stories", sid)
        meta_path = os.path.join(s_dir, "meta.json")
        if target_ids and sid not in target_ids:
            if os.path.exists(meta_path):
                old_m = json.load(open(meta_path, encoding="utf-8"))
                index_list.append({"id": sid, "level": old_m.get("level", 1), "titles": old_m["titles"], "cover": f"./stories/{sid}/cover.png"})
            continue
        story_hash = hashlib.md5(json.dumps(item, sort_keys=True, ensure_ascii=False).encode("utf-8")).hexdigest()
        all_ok = all(os.path.exists(os.path.join(s_dir, f"{k}.wav")) for k in ["hk", "tw", "cn", "en"])
        if not target_ids and not force_rebuild and os.path.exists(meta_path) and all_ok:
            old_m = json.load(open(meta_path, encoding="utf-8"))
            print(f"⚡ 已存在，自動跳過：{sid} {item['title_zh'].replace('|', '')}")
            index_list.append({"id": sid, "level": old_m.get("level", 1), "titles": old_m["titles"], "cover": f"./stories/{sid}/cover.png"})
            continue
        print(f"🌍 正在生成四語音軌 + 三字形版本: {item['title_zh']} / {item['title_en']}...")
        zh_paras = [p.strip() for p in item["zh"].split("\n") if p.strip()]
        en_paras = [p.strip() for p in item["en"].split("\n") if p.strip()]
        tracks = {}
        for lk in ["hk", "tw", "cn"]: tracks[lk] = await build_track(sid, lk, [item["title_zh"]] + zh_paras, "public/reading/assets/words")
        tracks["en"] = await build_track(sid, "en", [item["title_en"]] + en_paras, "public/reading/assets/words")

        detail = {
            "id": sid,
            "titles": {"hk": cc_hk.convert(item["title_zh"].replace("|", "")), "tw": cc_tw.convert(item["title_zh"].replace("|", "")), "cn": cc_cn.convert(item["title_zh"].replace("|", "")), "en": item["title_en"].replace("|", "")},
            "tracks": tracks
        }
        json.dump(detail, open(f"public/reading/stories/{sid}.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        index.append({
            "id": sid,
            "level": item.get("level", 1),
            "titles": detail["titles"],
            "cover": f"/reading/assets/covers/{sid}.png?v=2"
        })
    json.dump(index, open("public/reading/stories/index.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("🎉 所有故事的四語種（粵/國/普/英）與三字形（港澳繁/台灣繁/簡體）已全部生成！")

asyncio.run(main())
