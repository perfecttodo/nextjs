const GDriveSync = (() => {
  const STORAGE_KEY = "reading_gdrive_cfg_v2";
  const GIS_SCRIPT_URL = "https://accounts.google.com/gsi/client";
  const SCOPES = "https://www.googleapis.com/auth/drive.file";
  const FIXED_CLIENT_ID = "802199089900-5n676d4hansnab5c66igukb1mch5m7m1.apps.googleusercontent.com";

  const defaultCfg = {
    enabled: false,
    folderId: "",
    folderName: "預設根目錄"
  };

  let cfg = Object.assign({}, defaultCfg, JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"));
  let accessToken = null;
  let tokenExpiresAt = 0;

  const notify = (msg) => {
    if (window.CustomUI?.showToast) CustomUI.showToast(msg);
    else console.log(msg);
  };

  const save = (patch) => {
    cfg = Object.assign({}, cfg, patch);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  };

  function escapeDriveQuery(str) {
    return String(str || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  }

  function ensureGisScript() {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts?.oauth2) return resolve();

      let script = document.querySelector(`script[src="${GIS_SCRIPT_URL}"]`);
      if (!script) {
        script = document.createElement("script");
        script.src = GIS_SCRIPT_URL;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }

      const onLoad = () => {
        if (window.google?.accounts?.oauth2) resolve();
        else reject(new Error("GIS_UNAVAILABLE"));
      };
      const onError = () => reject(new Error("GIS_LOAD_FAILED"));

      script.addEventListener("load", onLoad, { once: true });
      script.addEventListener("error", onError, { once: true });

      setTimeout(() => {
        if (window.google?.accounts?.oauth2) resolve();
        else reject(new Error("GIS_TIMEOUT"));
      }, 6000);
    });
  }

  async function auth(forcePrompt = false) {
    if (!forcePrompt && accessToken && Date.now() < tokenExpiresAt - 15000) {
      return accessToken;
    }

    try {
      await ensureGisScript();
    } catch (_) {
      notify("⚠️ 無法載入 Google 登入元件，請檢查網路、廣告攔截器或第三方 Cookie");
      return null;
    }

    return new Promise((resolve) => {
      let settled = false;
      const done = (tk) => {
        if (!settled) {
          settled = true;
          resolve(tk);
        }
      };

      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: FIXED_CLIENT_ID,
          scope: SCOPES,
          callback: (resp) => {
            if (!resp || resp.error) {
              notify("⚠️ Google 登入失敗" + (resp?.error ? `：${resp.error}` : ""));
              return done(null);
            }
            accessToken = resp.access_token || null;
            const expiresInSec = Number(resp.expires_in) || 3600;
            tokenExpiresAt = Date.now() + expiresInSec * 1000;
            done(accessToken);
          },
          error_callback: (err) => {
            const msg = err?.type === "popup_failed_to_open"
              ? "彈出視窗被瀏覽器攔截，請允許彈出視窗"
              : (err?.message || "登入視窗已關閉或中斷");
            notify(`⚠️ ${msg}`);
            done(null);
          }
        });

        client.requestAccessToken({ prompt: forcePrompt ? "select_account" : "" });
      } catch (_) {
        notify("⚠️ 初始化 Google 登入失敗，請確認網域已加入 OAuth 允許清單");
        done(null);
      }
    });
  }

  async function driveFetch(url, options = {}) {
    const tk = await auth(false);
    if (!tk) return null;

    const headers = Object.assign({}, options.headers || {}, {
      Authorization: "Bearer " + tk
    });

    let res = await fetch(url, Object.assign({}, options, { headers }));
    if (res.status === 401) {
      accessToken = null;
      tokenExpiresAt = 0;
      const freshTk = await auth(true);
      if (!freshTk) return null;
      res = await fetch(url, Object.assign({}, options, {
        headers: Object.assign({}, options.headers || {}, {
          Authorization: "Bearer " + freshTk
        })
      }));
    }

    if (!res.ok) {
      throw new Error(`DRIVE_HTTP_${res.status}`);
    }
    return res;
  }

  async function pickFolder() {
    const tk = await auth(false);
    if (!tk) return;

    notify("⏳ 讀取 Drive 資料夾...");
    let folders = [];
    try {
      const q = encodeURIComponent("mimeType='application/vnd.google-apps.folder' and trashed=false");
      const r = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&orderBy=name&pageSize=50`);
      if (!r) return;
      const data = await r.json();
      folders = data.files || [];
    } catch (_) {
      notify("⚠️ 讀取資料夾失敗");
      return;
    }

    if (!window.CustomUI?.showPrompt) {
      notify("⚠️ 缺少輸入對話框元件");
      return;
    }

    const defaultVal = cfg.folderName === "預設根目錄" ? "快樂小讀者備份" : cfg.folderName;
    const suggestions = ["預設根目錄", ...folders.map((f) => f.name).filter((n) => n !== "預設根目錄")].slice(0, 8);

    const inputName = await CustomUI.showPrompt({
      title: "📁 選擇或建立資料夾",
      desc: "點選資料夾、輸入新名稱，或輸入「預設根目錄」回到根目錄：",
      defaultValue: defaultVal,
      suggestions
    });

    if (inputName === null || inputName === undefined) return;
    const targetName = inputName.trim();
    if (!targetName) {
      notify("⚠️ 資料夾名稱不可為空白");
      return;
    }

    if (targetName === "預設根目錄") {
      save({ folderId: "", folderName: "預設根目錄" });
      renderPanel();
      notify("📁 已切換為：預設根目錄");
      return;
    }

    const currentMatched = cfg.folderId
      ? folders.find((f) => f.id === cfg.folderId && f.name === targetName)
      : null;
    const matched = currentMatched || folders.find((f) => f.name === targetName);

    if (matched) {
      save({ folderId: matched.id, folderName: matched.name });
      renderPanel();
      notify("📁 已選定：" + matched.name);
      return;
    }

    try {
      const safeFolderName = escapeDriveQuery(targetName);
      const dupCheck = await driveFetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`name='${safeFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`)}&fields=files(id,name)&pageSize=1`
      );
      if (dupCheck) {
        const dupData = await dupCheck.json();
        if (dupData.files && dupData.files[0]) {
          const existing = dupData.files[0];
          save({ folderId: existing.id, folderName: existing.name });
          renderPanel();
          notify("📁 已連結現有資料夾：" + existing.name);
          return;
        }
      }

      const cr = await driveFetch("https://www.googleapis.com/drive/v3/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: targetName,
          mimeType: "application/vnd.google-apps.folder"
        })
      });
      if (!cr) return;
      const created = await cr.json();
      if (created.id) {
        save({ folderId: created.id, folderName: created.name });
        renderPanel();
        notify("🎉 已建立：" + created.name);
      }
    } catch (_) {
      notify("⚠️ 建立資料夾失敗");
    }
  }

  function safeName(str) {
    return String(str || "item").replace(/[\\/:*?"<>|]/g, "_").slice(0, 50);
  }

  async function uploadSelected() {
    const ids = Array.from(document.querySelectorAll(".gdrive-rec-chk:checked")).map((el) => el.value);
    if (!ids.length) {
      notify("⚠️ 請先勾選要上傳的錄音");
      return;
    }

    const tk = await auth(false);
    if (!tk) return;

    const allRecs = await ParentVoice.getAllRecordings();
    const recs = allRecs.filter((r) => ids.includes(r.id));
    if (!recs.length) {
      notify("⚠️ 找不到勾選的錄音資料");
      return;
    }

    notify(`☁️ 正在上傳 ${recs.length} 筆錄音...`);
    let ok = 0;

    for (const rec of recs) {
      try {
        const b64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(String(reader.result || "").split(",")[1] || "");
          reader.onerror = reject;
          reader.readAsDataURL(rec.blob);
        });

        const payload = Object.assign({}, rec, {
          audioBase64: b64,
          audioMime: rec.blob?.type || "audio/webm"
        });
        delete payload.blob;

        const fileName = `KidsReading_${safeName(rec.storyTitle)}_${safeName(rec.label)}_${safeName(rec.id)}.json`;
        const meta = { name: fileName, mimeType: "application/json" };
        if (cfg.folderId) meta.parents = [cfg.folderId];

        const boundary = "-------314159265358979";
        const body =
          `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
          `${JSON.stringify(meta)}\r\n` +
          `--${boundary}\r\nContent-Type: application/json\r\n\r\n` +
          `${JSON.stringify(payload)}\r\n` +
          `--${boundary}--`;

        const res = await driveFetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
          method: "POST",
          headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
          body
        });
        if (res && res.ok) ok++;
      } catch (_) {
        // 單筆失敗不中斷其餘錄音
      }
    }

    notify(`✅ 已成功上傳 ${ok} / ${recs.length} 筆錄音`);
  }

  async function loadFromDrive() {
    const tk = await auth(false);
    if (!tk) return;

    notify("⏳ 查詢雲端備份...");
    const parentClause = cfg.folderId ? `'${cfg.folderId}' in parents and ` : "";
    const q = encodeURIComponent(`${parentClause}name contains 'KidsReading_' and mimeType='application/json' and trashed=false`);

    let files = [];
    try {
      const r = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&orderBy=createdTime desc&pageSize=30`);
      if (!r) return;
      const data = await r.json();
      files = data.files || [];
    } catch (_) {
      notify("⚠️ 讀取雲端檔案失敗");
      return;
    }

    const listEl = document.getElementById("gdrive-cloud-files");
    if (!listEl) return;

    if (!files.length) {
      listEl.innerHTML = "";
      notify("ℹ️ 資料夾內沒有錄音備份檔");
      return;
    }

    listEl.innerHTML =
      "<div style='font-size:12px;font-weight:bold;color:#0369A1;margin:8px 0 4px;'>☁️ 點擊載入到本機：</div>" +
      files.map((f) => {
        const cleanTitle = f.name.replace(/^KidsReading_|\.json$/g, "");
        return `<div style="display:flex;justify-content:space-between;align-items:center;background:#fff;padding:6px 10px;border-radius:10px;margin-bottom:4px;border:1px solid #BAE6FD;gap:8px;">
          <span style="font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${f.name}">${cleanTitle}</span>
          <button type="button" class="btn-mini" style="background:#0284C7;color:#fff;flex-shrink:0;" onclick="GDriveSync.importOne('${f.id}')">載入</button>
        </div>`;
      }).join("");
  }

  async function importOne(fileId) {
    try {
      const r = await driveFetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`);
      if (!r) return;
      const p = await r.json();
      if (!p || !p.audioBase64) {
        notify("⚠️ 備份檔格式不完整");
        return;
      }

      const bin = atob(p.audioBase64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);

      await ParentVoice.importRawRecord({
        id: p.id || ("rec_" + Date.now()),
        storyId: p.storyId,
        storyTitle: p.storyTitle,
        langId: p.langId,
        langLabel: p.langLabel,
        label: p.label,
        blob: new Blob([arr], { type: p.audioMime || "audio/webm" }),
        timings: p.timings || {},
        createdAt: p.createdAt || Date.now()
      });

      notify(`🎉 已載入「${p.storyTitle || "錄音"}」`);
      if (typeof renderManagerList === "function") renderManagerList();
    } catch (_) {
      notify("⚠️ 載入錄音失敗");
    }
  }

  function renderPanel() {
    const box = document.getElementById("gdrive-plugin-slot");
    if (!box) return;

    if (!cfg.enabled) {
      box.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;background:#F8FAFC;border:1px dashed #CBD5E1;border-radius:14px;padding:8px 12px;margin-bottom:10px;">
          <span style="font-size:14px;font-weight:bold;color:#475569;">☁️ Google Drive 同步</span>
          <button type="button" class="btn-mini" style="background:#0284C7;color:#fff;" onclick="GDriveSync.toggle(true)">開啟</button>
        </div>`;
      return;
    }

    box.innerHTML = `
      <div style="background:#F0F9FF;border:1.5px solid #BAE6FD;border-radius:14px;padding:10px 12px;margin-bottom:10px;text-align:left;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:8px;">
          <span style="font-size:13px;font-weight:bold;color:#0369A1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">📁 ${cfg.folderName || "預設根目錄"}</span>
          <div style="display:flex;gap:6px;flex-shrink:0;">
            <button type="button" class="btn-mini" style="background:#FEF3C7;color:#92400E;" onclick="GDriveSync.pickFolder()">資料夾</button>
            <button type="button" class="btn-mini" style="background:#FEE2E2;color:#B91C1C;" onclick="GDriveSync.toggle(false)">關閉</button>
          </div>
        </div>
        <div style="display:flex;gap:8px;">
          <button type="button" class="btn-mini" style="flex:1;background:#0284C7;color:#fff;padding:7px;" onclick="GDriveSync.uploadSelected()">⬆️ 上傳勾選</button>
          <button type="button" class="btn-mini" style="flex:1;background:#10B981;color:#fff;padding:7px;" onclick="GDriveSync.loadFromDrive()">⬇️ 從 Drive 載入</button>
        </div>
        <div id="gdrive-cloud-files"></div>
      </div>`;
  }

  function toggle(enabled) {
    save({ enabled: Boolean(enabled) });
    if (!enabled) {
      accessToken = null;
      tokenExpiresAt = 0;
    }
    renderPanel();
    if (typeof renderManagerList === "function") renderManagerList();
  }

  return {
    isEnabled: () => cfg.enabled,
    renderPanel,
    toggle,
    pickFolder,
    uploadSelected,
    loadFromDrive,
    importOne
  };
})();
