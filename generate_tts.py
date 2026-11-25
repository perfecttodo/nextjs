import asyncio, difflib, glob, hashlib, json, os, re, shutil, subprocess, tempfile, wave, edge_tts, jieba
import numpy as np
from pathlib import Path
from faster_whisper import WhisperModel

if os.path.exists("raw_stories/dict.txt.big"): jieba.set_dictionary("raw_stories/dict.txt.big")
if os.path.exists("raw_stories/custom_dict.txt"):
    for line in open("raw_stories/custom_dict.txt", encoding="utf-8"):
        if line.strip(): jieba.add_word(line.strip(), freq=20000)

PUNCT_ONLY = re.compile(r'^[\s\W_]+$', re.UNICODE)
EN_SPLIT = re.compile(r'([A-Za-z0-9\']+|[^\w\s])')
NUM_MEASURE = re.compile(r'^[一二三四五六七八九十兩幾這那每][隻個條對雙棵朵張本件位只]$')
LANG_MAP = {"_hk": ("zh-HK", "粵語", "zh-HK-HiuGaaiNeural", "zh"), "_tw": ("zh-TW", "國語", "zh-TW-HsiaoChenNeural", "zh"), "_cn": ("zh-CN", "普通話", "zh-CN-XiaoxiaoNeural", "zh"), "_en": ("en-US", "English", "en-US-AnaNeural", "en")}

print("⏳ 載入 Whisper 語音對齊引擎...")
whisper_model = WhisperModel("small", device="cpu", compute_type="int8")

def detect_lang(stem, text):
    for suffix, cfg in LANG_MAP.items():
        if stem.endswith(suffix): return stem[:-len(suffix)], cfg
    return (stem, LANG_MAP["_en"]) if re.fullmatch(r'[\x00-\x7F]+', text.strip()) else (stem, LANG_MAP["_hk"])

def tokenize_story(text, lang):
    if lang.startswith("en"): return [t for t in EN_SPLIT.findall(text.replace("|", " ")) if t.strip()]
    tokens = []
    for chunk in text.split("|"):
        for seg in re.split(r'([^\u4e00-\u9fff]+)', chunk):
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
    if os.path.exists(out_mp3) and os.path.getsize(out_mp3) == 0:
        os.remove(out_mp3)
    if not os.path.exists(out_mp3):
        for _ in range(3):
            try:
                await edge_tts.Communicate(word, voice, rate="-10%").save(out_mp3)
                if os.path.exists(out_mp3) and os.path.getsize(out_mp3) > 100:
                    break
            except Exception:
                await asyncio.sleep(0.5)
    return out_mp3, f"./assets/words/{key}.mp3"

def trim_mp3_to_wav(mp3_path, out_wav, sr=24000):
    if not os.path.exists(mp3_path) or os.path.getsize(mp3_path) < 100:
        return make_silence_wav(0.2, out_wav, sr)
    res = subprocess.run(["ffmpeg", "-y", "-i", mp3_path, "-f", "s16le", "-ac", "1", "-acodec", "pcm_s16le", "-ar", str(sr), "-"], capture_output=True)
    if res.returncode != 0 or not res.stdout:
        return make_silence_wav(0.2, out_wav, sr)
    pcm = res.stdout
    samples = np.frombuffer(pcm, dtype=np.int16)
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

def make_silence_wav(dur_sec, out_wav, sr=24000):
    n = int(round(dur_sec * sr))
    with wave.open(out_wav, "wb") as wf:
        wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(sr); wf.writeframes(np.zeros(n, dtype=np.int16).tobytes())
    return n / float(sr)

def align_story_timestamps(mp3_path, w_lang, raw_paragraphs):
    pcm = subprocess.run(["ffmpeg", "-nostdin", "-threads", "0", "-i", mp3_path, "-f", "s16le", "-ac", "1", "-acodec", "pcm_s16le", "-ar", "16000", "-"], capture_output=True, check=True).stdout
    audio_np = np.frombuffer(pcm, np.int16).flatten().astype(np.float32) / 32768.0
    total_dur = len(audio_np) / 16000.0
    segments, _ = whisper_model.transcribe(audio_np, language=w_lang, initial_prompt="".join(p.replace("|", "") for p in raw_paragraphs)[:200], word_timestamps=True)
    w_chars = []
    for seg in segments:
        if not seg.words: continue
        for w in seg.words:
            clean = w.word.strip().lower()
            if not clean: continue
            sub = re.findall(r'[a-z0-9\']+|[一-龥]', clean)
            if len(sub) <= 1: w_chars.append((clean, w.start, w.end))
            else:
                d = (w.end - w.start) / len(sub)
                for idx, ch in enumerate(sub): w_chars.append((ch, w.start + idx * d, w.start + (idx + 1) * d))
    word_spans, flat_orig = [], []
    for para in raw_paragraphs:
        lc = "en" if re.fullmatch(r'[\x00-\x7F]+', para.replace("|", "")) else "zh"
        for tok in tokenize_story(para, lc):
            if PUNCT_ONLY.match(tok): continue
            parts = [tok.lower()] if lc == "en" else list(tok)
            word_spans.append((len(flat_orig), len(flat_orig) + len(parts)))
            flat_orig.extend(parts)
    n, times = len(flat_orig), [None] * len(flat_orig)
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, flat_orig, [x for x in w_chars], autojunk=False).get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1): _, st, ed = w_chars[j1 + k]; times[i1 + k] = (st, ed)
    i = 0
    while i < n:
        if times[i] is not None: i += 1; continue
        g_st = i
        while i < n and times[i] is None: i += 1
        g_ed = i
        _, prev_t = times[g_st - 1] if g_st > 0 else (0.0, 0.05)
        next_t, _ = times[g_ed] if g_ed < n else (max(prev_t + 0.2 * (g_ed - g_st), total_dur - 0.05), 0.0)
        step = max(0.06 * (g_ed - g_st), next_t - prev_t) / (g_ed - g_st)
        for k in range(g_ed - g_st): times[g_st + k] = (prev_t + k * step, prev_t + (k + 1) * step)
    return [(round(times[s].__getitem__(0), 3), round(times[e - 1].__getitem__(1), 3)) for s, e in word_spans]

async def process_file(idx, fp):
    stem = Path(fp).stem
    raw = open(fp, encoding="utf-8").read().strip()
    title, (lang, label, voice, w_lang) = detect_lang(stem, raw)
    sid = f"story_{idx:03d}"
    fluent_mp3, exact_mp3, words_dir = f"public/reading/assets/audio/{sid}.mp3", f"public/reading/assets/audio/{sid}_exact.mp3", "public/reading/assets/words"
    os.makedirs(words_dir, exist_ok=True)
    paragraphs = [p.strip().replace("|", "") for p in raw.split("\n") if p.strip()]
    raw_paragraphs = [p.strip() for p in raw.split("\n") if p.strip()]
    print(f"🎙️ 正在生成雙模式音軌: {title}...")
    await edge_tts.Communicate("\n".join(paragraphs), voice, rate="-12%").save(fluent_mp3)
    f_iter = iter(align_story_timestamps(fluent_mp3, w_lang, raw_paragraphs))

    tmp_dir, wav_list, final_tokens, exact_t, step_i, last_f_end = tempfile.mkdtemp(), [], [], 0.0, 0, 0.0
    w_init = os.path.join(tmp_dir, f"s_{step_i:04d}.wav"); exact_t += make_silence_wav(0.1, w_init); wav_list.append(w_init); step_i += 1

    for p_idx, para in enumerate(raw_paragraphs):
        if p_idx > 0:
            final_tokens.append({"isBreak": True})
            w_para = os.path.join(tmp_dir, f"s_{step_i:04d}.wav"); exact_t += make_silence_wav(0.55, w_para); wav_list.append(w_para); step_i += 1
        for tok in tokenize_story(para, lang):
            if PUNCT_ONLY.match(tok):
                w_p = os.path.join(tmp_dir, f"s_{step_i:04d}.wav"); real_p = make_silence_wav(0.42 if tok in "。！？!?" else 0.25, w_p); wav_list.append(w_p); step_i += 1
                final_tokens.append({"text": tok, "isPunct": True, "start": round(last_f_end, 3), "end": round(last_f_end + 0.05, 3), "exactStart": round(exact_t, 3), "exactEnd": round(exact_t + real_p, 3)})
                exact_t += real_p
            else:
                f_st, f_ed = next(f_iter, (last_f_end, last_f_end + 0.25)); last_f_end = f_ed
                w_mp3_local, w_mp3_url = await ensure_word_audio(tok, voice, words_dir)
                w_wav = os.path.join(tmp_dir, f"s_{step_i:04d}.wav"); dur = trim_mp3_to_wav(w_mp3_local, w_wav); wav_list.append(w_wav); step_i += 1
                final_tokens.append({"text": tok, "isPunct": False, "wordAudio": w_mp3_url, "start": f_st, "end": f_ed, "exactStart": round(exact_t, 3), "exactEnd": round(exact_t + dur, 3)})
                exact_t += dur
                w_gap = os.path.join(tmp_dir, f"s_{step_i:04d}.wav"); exact_t += make_silence_wav(0.035, w_gap); wav_list.append(w_gap); step_i += 1

    concat_txt = os.path.join(tmp_dir, "concat.txt")
    open(concat_txt, "w").write("".join(f"file '{w}'\n" for w in wav_list))
    subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_txt, "-c:a", "libmp3lame", "-b:a", "128k", exact_mp3], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    shutil.rmtree(tmp_dir, ignore_errors=True)

    old_cover = next((item.get("cover", "") for item in json.load(open("public/reading/stories/index.json", encoding="utf-8")) if item.get("id") == sid), "") if os.path.exists("public/reading/stories/index.json") else ""
    json.dump({"id": sid, "title": title, "lang": lang, "text": "\n\n".join(paragraphs), "audioUrl": f"./assets/audio/{sid}.mp3", "exactAudioUrl": f"./assets/audio/{sid}_exact.mp3", "tokens": final_tokens}, open(f"public/reading/stories/{sid}.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    return {"id": sid, "title": title, "lang": lang, "langLabel": label, "cover": old_cover}

async def main():
    index = [await process_file(i + 1, f) for i, f in enumerate(sorted(glob.glob("raw_stories/txt/*.txt")))]
    json.dump(index, open("public/reading/stories/index.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("🎉 雙模式音軌全部生成完成！")

asyncio.run(main())

async def process_file(idx, fp):
    stem = Path(fp).stem
    raw = open(fp, encoding="utf-8").read().strip()
    title, (lang, label, voice, w_lang) = detect_lang(stem, raw)
    sid = f"story_{idx:03d}"
    fluent_mp3, exact_mp3, words_dir = f"public/reading/assets/audio/{sid}.mp3", f"public/reading/assets/audio/{sid}_exact.mp3", "public/reading/assets/words"
    os.makedirs(words_dir, exist_ok=True)
    paragraphs = [p.strip().replace("|", "") for p in raw.split("\n") if p.strip()]
    raw_paragraphs = [p.strip() for p in raw.split("\n") if p.strip()]
    print(f"🎙️ 正在生成雙模式音軌: {title}...")
    await edge_tts.Communicate("\n".join(paragraphs), voice, rate="-12%").save(fluent_mp3)
    f_iter = iter(align_story_timestamps(fluent_mp3, w_lang, raw_paragraphs))

    tmp_dir, wav_list, final_tokens, exact_t, step_i, last_f_end = tempfile.mkdtemp(), [], [], 0.0, 0, 0.0
    w_init = os.path.join(tmp_dir, f"s_{step_i:04d}.wav"); exact_t += make_silence_wav(0.1, w_init); wav_list.append(w_init); step_i += 1

    for p_idx, para in enumerate(raw_paragraphs):
        if p_idx > 0:
            final_tokens.append({"isBreak": True})
            w_para = os.path.join(tmp_dir, f"s_{step_i:04d}.wav"); exact_t += make_silence_wav(0.55, w_para); wav_list.append(w_para); step_i += 1
        for tok in tokenize_story(para, lang):
            if PUNCT_ONLY.match(tok):
                w_p = os.path.join(tmp_dir, f"s_{step_i:04d}.wav"); real_p = make_silence_wav(0.42 if tok in "。！？!?" else 0.25, w_p); wav_list.append(w_p); step_i += 1
                final_tokens.append({"text": tok, "isPunct": True, "start": round(last_f_end, 3), "end": round(last_f_end + 0.05, 3), "exactStart": round(exact_t, 3), "exactEnd": round(exact_t + real_p, 3)})
                exact_t += real_p
            else:
                f_st, f_ed = next(f_iter, (last_f_end, last_f_end + 0.25)); last_f_end = f_ed
                w_mp3_local, w_mp3_url = await ensure_word_audio(tok, voice, words_dir)
                w_wav = os.path.join(tmp_dir, f"s_{step_i:04d}.wav"); dur = trim_mp3_to_wav(w_mp3_local, w_wav); wav_list.append(w_wav); step_i += 1
                final_tokens.append({"text": tok, "isPunct": False, "wordAudio": w_mp3_url, "start": f_st, "end": f_ed, "exactStart": round(exact_t, 3), "exactEnd": round(exact_t + dur, 3)})
                exact_t += dur
                w_gap = os.path.join(tmp_dir, f"s_{step_i:04d}.wav"); exact_t += make_silence_wav(0.035, w_gap); wav_list.append(w_gap); step_i += 1

    concat_txt = os.path.join(tmp_dir, "concat.txt")
    open(concat_txt, "w").write("".join(f"file '{w}'\n" for w in wav_list))
    subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_txt, "-c:a", "libmp3lame", "-b:a", "128k", exact_mp3], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    shutil.rmtree(tmp_dir, ignore_errors=True)

    old_cover = next((item.get("cover", "") for item in json.load(open("public/reading/stories/index.json", encoding="utf-8")) if item.get("id") == sid), "") if os.path.exists("public/reading/stories/index.json") else ""
    json.dump({"id": sid, "title": title, "lang": lang, "text": "\n\n".join(paragraphs), "audioUrl": f"./assets/audio/{sid}.mp3", "exactAudioUrl": f"./assets/audio/{sid}_exact.mp3", "tokens": final_tokens}, open(f"public/reading/stories/{sid}.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    return {"id": sid, "title": title, "lang": lang, "langLabel": label, "cover": old_cover}

async def main():
    index = [await process_file(i + 1, f) for i, f in enumerate(sorted(glob.glob("raw_stories/txt/*.txt")))]
    json.dump(index, open("public/reading/stories/index.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("🎉 雙模式音軌全部生成完成！")

asyncio.run(main())
