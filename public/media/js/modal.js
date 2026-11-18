(function () {
    'use strict';
    const U = window.MP3Utils;

    function showCustomModal({ title, subtitle = '系統通知', message, type = 'info', isPrompt = false, defaultValue = '', confirmText = '確定' }) {
        return new Promise((resolve) => {
            const modal = document.getElementById('customModal');
            const modalBox = document.getElementById('modalBox');
            const titleEl = document.getElementById('modalTitle');
            const subtitleEl = document.getElementById('modalSubtitle');
            const bodyEl = document.getElementById('modalBody');
            const confirmBtn = document.getElementById('modalConfirmBtn');
            const cancelBtn = document.getElementById('modalCancelBtn');
            const iconEl = document.getElementById('modalIcon');
            const iconContainer = document.getElementById('modalIconContainer');

            titleEl.innerText = title;
            subtitleEl.innerText = subtitle;
            confirmBtn.innerText = confirmText;

            let iconClass = 'fa-solid fa-circle-info';
            let iconBgClass = 'bg-indigo-500/20 text-indigo-400';
            let confirmBtnClass = 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30';
            if (type === 'error' || type === 'danger') {
                iconClass = 'fa-solid fa-triangle-exclamation';
                iconBgClass = 'bg-rose-500/20 text-rose-400';
                confirmBtnClass = 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30';
            } else if (type === 'success') {
                iconClass = 'fa-solid fa-circle-check';
                iconBgClass = 'bg-emerald-500/20 text-emerald-400';
                confirmBtnClass = 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30';
            }
            iconEl.className = iconClass;
            iconContainer.className = `w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBgClass}`;
            confirmBtn.className = `px-5 py-2 rounded-xl text-xs font-medium text-white transition shadow-lg ${confirmBtnClass}`;
            const needsCancel = (type === 'confirm' || type === 'danger' || isPrompt);
            cancelBtn.classList.toggle('hidden', !needsCancel);

            if (isPrompt) {
                bodyEl.innerHTML = `<p class="mb-2 text-slate-300">${message}</p><input type="text" id="modalPromptInput" value="${U.escapeHtmlAttr(defaultValue)}" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500">`;
            } else {
                bodyEl.innerHTML = `<p>${message.replace(/\n/g, '<br>')}</p>`;
            }

            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                modalBox.classList.remove('scale-95');
                if (isPrompt) {
                    const inputEl = document.getElementById('modalPromptInput');
                    if (inputEl) { inputEl.focus(); inputEl.select(); }
                }
            }, 10);

            const newConfirmBtn = confirmBtn.cloneNode(true);
            const newCancelBtn = cancelBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
            cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

            const closeModal = (result) => {
                modal.classList.add('opacity-0');
                modalBox.classList.add('scale-95');
                setTimeout(() => { modal.classList.add('hidden'); resolve(result); }, 200);
            };
            newConfirmBtn.addEventListener('click', () =>
                closeModal(isPrompt ? document.getElementById('modalPromptInput').value : true));
            newCancelBtn.addEventListener('click', () => closeModal(isPrompt ? null : false));
            if (isPrompt) {
                document.getElementById('modalPromptInput').addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') newConfirmBtn.click();
                });
            }
        });
    }
    window.MP3Modal = { showCustomModal };
    window.showCustomModal = showCustomModal; // 兼容既有 HTML onclick / 插件
})();