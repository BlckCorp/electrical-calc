(() => {
  const $ = (id) => document.getElementById(id);
  const money = (value) => Math.round(Number(value) || 0);
  const rub = (value) => `${money(value).toLocaleString('ru-RU')} ₽`;
  const raw = (value) => String(money(value));
  const today = new Date().toISOString().slice(0, 10);
  const modeKey = 'master_calc_mode_v1';

  const actDefaults = {
    number: `УР/07-${String(Math.floor(Date.now() / 1000)).slice(-6)}`,
    date: today,
    executor: 'Владимир',
    phone: '+79001189603',
    warranty: 30,
    recommended: 'Замена крана, отсекающего унитаз\nЗамена гибкой подводки на смеситель в ванне'
  };

  const quickTemplates = [
    { title: 'Розетка', serviceId: 'socket', qty: 1 },
    { title: 'Нет света', serviceId: 'lineDiagnostic', qty: 1 },
    { title: 'Выбивает автомат', serviceId: 'lineDiagnostic', qty: 1 },
    { title: 'Люстра', serviceId: 'chandelier', qty: 1 },
    { title: 'Окно', serviceId: 'windowAdjust', qty: 1 },
    { title: 'Шкаф', serviceId: 'furnitureWardrobe', qty: 1 },
    { title: 'Кровать', serviceId: 'furnitureBed', qty: 1 },
    { title: 'Мелкий ремонт', serviceId: 'smallRepair', qty: 1 }
  ];

  function serviceList() { return typeof services !== 'undefined' && Array.isArray(services) ? services : []; }
  function groupList() { return typeof groups !== 'undefined' && Array.isArray(groups) ? groups : []; }
  function selectedWorks() { return typeof selected === 'function' ? selected() : []; }
  function recalc() { if (typeof calculate === 'function') calculate(); }
  function value(id) { return $(id)?.value || ''; }
  function numberValue(id, fallback = 0) { const n = Number($(id)?.value); return Number.isFinite(n) && n >= 0 ? n : fallback; }
  function formatDate(value) { const date = value ? new Date(`${value}T00:00:00`) : new Date(); return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }); }

  function totals() {
    const works = selectedWorks();
    const selectedSubtotal = works.reduce((sum, item) => sum + money(item.subtotal), 0);
    const visit = numberValue('visitPrice');
    const materials = numberValue('materialsExtra');
    const minimum = numberValue('minimumPrice');
    const complexity = Number($('complexity')?.value || 1);
    const urgency = Number($('urgency')?.value || 1);
    const discountPercent = Math.min(50, numberValue('discount'));
    const base = selectedSubtotal + visit + materials;
    const withCoefficients = Math.round(base * complexity * urgency);
    const coefficientExtra = Math.max(0, withCoefficients - base);
    const discountValue = Math.round(withCoefficients * (discountPercent / 100));
    const afterDiscount = withCoefficients - discountValue;
    const total = works.length ? Math.max(afterDiscount, minimum) : 0;
    const minimumExtra = works.length && total === minimum && afterDiscount < minimum ? minimum - afterDiscount : 0;

    const actRows = works.map((item) => ({ title: item.title, qty: item.qty, unit: item.unit, price: money(item.price), subtotal: money(item.subtotal) }));
    if (works.length && visit > 0) actRows.push({ title: 'Выезд мастера', qty: 1, unit: 'работа', price: visit, subtotal: visit });
    if (works.length && coefficientExtra > 0) actRows.push({ title: 'Доплата за сложность / срочность', qty: 1, unit: 'работа', price: coefficientExtra, subtotal: coefficientExtra });
    if (works.length && minimumExtra > 0) actRows.push({ title: 'Доплата до минимального заказа', qty: 1, unit: 'работа', price: minimumExtra, subtotal: minimumExtra });
    const workTotal = actRows.reduce((sum, item) => sum + money(item.subtotal), 0);
    return { works, actRows, workTotal, materials, discountValue, total };
  }

  function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      body{background:#0b1120!important}.page{width:min(980px,calc(100% - 24px))!important;padding:18px 0 34px!important}.hero{padding:22px!important;margin-bottom:14px!important;border-radius:18px!important;box-shadow:none!important}.hero:after,.badges,.toolbar,#servicesList,#details{display:none!important}h1{font-size:clamp(1.75rem,4vw,3rem)!important;letter-spacing:-.04em!important}.subtitle{max-width:620px!important;font-size:.98rem!important;line-height:1.45!important}.layout{grid-template-columns:minmax(0,1fr) 320px!important;gap:14px!important}.card{border-radius:18px!important;box-shadow:none!important;background:rgba(255,255,255,.065)!important}.services,.options,.result{padding:16px!important}.head{margin-bottom:10px!important}.head h2{font-size:1.25rem!important}.chip,.ghost{padding:7px 10px!important;font-size:.84rem!important}.options{display:none!important}.options.open{display:grid!important}.side{gap:14px!important}.result strong{font-size:2.35rem!important;margin-bottom:8px!important}.mode-switch{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.mode-btn{border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.08);color:var(--muted);border-radius:999px;padding:8px 12px;font-weight:850}.mode-btn.active{background:var(--accent);color:#111827;border-color:var(--accent)}.quick-box{display:grid;gap:10px;margin-top:12px}.quick-title{color:var(--muted);font-weight:850;font-size:.92rem}.quick-list{display:flex;gap:8px;flex-wrap:wrap}.quick-btn{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.08);color:var(--text);border-radius:999px;padding:8px 11px;font-weight:800}.quick-btn:hover{border-color:rgba(245,158,11,.7);background:rgba(245,158,11,.15)}.dropdown-box{display:grid;gap:12px;margin-top:12px}.dropdown-grid{display:grid;grid-template-columns:1fr 1.5fr 90px;gap:10px;align-items:end}.dropdown-grid select,.dropdown-grid input{min-height:46px}.dropdown-add{min-height:46px}.picked-list{display:none;gap:8px;margin-top:4px;padding-top:12px;border-top:1px solid rgba(255,255,255,.1)}.picked-list.open{display:grid}.picked-row{display:grid;grid-template-columns:1fr auto auto;gap:8px;align-items:center;padding:8px 10px;border-radius:12px;background:rgba(2,6,23,.34);border:1px solid rgba(255,255,255,.08)}.picked-title{font-weight:760}.picked-meta{color:var(--muted2);font-size:.86rem}.picked-sum{color:var(--accent);font-weight:850;white-space:nowrap}.picked-remove{width:30px;height:30px;border-radius:10px;background:rgba(255,255,255,.08);color:var(--muted);font-weight:900}.settings-toggle{width:100%;margin-top:10px;background:rgba(255,255,255,.08)!important;color:var(--muted)!important;border:1px solid rgba(255,255,255,.14)!important}.client-actions{display:grid;gap:8px;margin-top:10px}.client-actions-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}.client-btn{border-radius:14px;padding:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.08);color:var(--text);font-weight:900;text-align:center;text-decoration:none}.client-btn.primary{background:var(--accent);color:#111827;border-color:var(--accent)}.client-status{color:var(--muted2);font-size:.86rem;min-height:1.2em}.act-panel{margin-top:18px;padding:0!important;overflow:hidden}.act-panel summary{padding:16px 18px;cursor:pointer;font-weight:900}.act-content{padding:0 18px 18px;display:grid;gap:14px}.act-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.act-grid .wide{grid-column:1/-1}.act-grid textarea{min-height:82px;resize:vertical}.act-buttons{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.act-buttons .main-btn{padding:12px}.act-preview{display:none;margin-top:18px;padding:18px}.act-preview.open{display:block}.act-preview-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:14px}.act-paper-scroll{width:100%;overflow-x:auto}.act-paper{background:#fff;color:#111;width:794px;min-width:794px;margin:0 auto;padding:28px 34px;font-family:'Times New Roman',serif;font-size:14px;box-shadow:0 20px 60px rgba(0,0,0,.35)}.act-paper table{width:100%;border-collapse:collapse}.act-paper td,.act-paper th{border:1px solid #111;padding:3px 6px;vertical-align:middle}.act-title{text-align:center;margin:0 0 24px;font-size:16px;font-weight:400}.act-red{color:#d11}.act-center{text-align:center}.act-right{text-align:right}.act-summary{width:36%;margin-left:auto}.act-line{border-bottom:1px solid #111;display:inline-block;min-width:230px}.act-footer{margin-top:12px;font-size:13px}body.client-mode #editBtn,body.client-mode .act-panel,body.client-mode .act-preview,body.client-mode .notes,body.client-mode .settings-toggle{display:none!important}body.master-mode .act-panel{display:block!important}@media(max-width:860px){.layout{grid-template-columns:1fr!important}.side{position:static!important}}@media(max-width:680px){.dropdown-grid,.act-grid,.act-buttons,.client-actions-row{grid-template-columns:1fr!important}.picked-row{grid-template-columns:1fr auto}.picked-sum{grid-column:1/2}.picked-remove{grid-column:2/3;grid-row:1/3}.act-preview-head{display:grid}}@media print{body{background:#fff!important}.hero,.layout,.notes,.act-panel,.editor,.act-preview-head{display:none!important}.page{width:100%!important;margin:0!important;padding:0!important}.act-preview{display:block!important;margin:0!important;padding:0!important;background:#fff!important;border:0!important;box-shadow:none!important}.act-paper-scroll{overflow:visible!important}.act-paper{box-shadow:none!important;width:100%!important;min-width:0!important;padding:0!important}@page{size:A4;margin:12mm}}
    `;
    document.head.appendChild(style);
  }

  function createModeSwitch() {
    const hero = document.querySelector('.hero');
    if (!hero || $('modeSwitch')) return;
    const switcher = document.createElement('div');
    switcher.id = 'modeSwitch';
    switcher.className = 'mode-switch';
    switcher.innerHTML = `<button class="mode-btn" data-mode="client" type="button">Клиент</button><button class="mode-btn" data-mode="master" type="button">Мастер</button>`;
    hero.appendChild(switcher);
    switcher.addEventListener('click', (event) => { const button = event.target.closest('[data-mode]'); if (button) setMode(button.dataset.mode); });
    setMode(localStorage.getItem(modeKey) || 'client');
  }

  function setMode(mode) {
    const safeMode = mode === 'master' ? 'master' : 'client';
    document.body.classList.toggle('client-mode', safeMode === 'client');
    document.body.classList.toggle('master-mode', safeMode === 'master');
    document.querySelectorAll('.mode-btn').forEach((button) => button.classList.toggle('active', button.dataset.mode === safeMode));
    localStorage.setItem(modeKey, safeMode);
  }

  function createDropdown() {
    const servicesCard = document.querySelector('.services');
    const servicesList = $('servicesList');
    if (!servicesCard || !servicesList || $('dropdownBox')) return;
    const title = servicesCard.querySelector('h2');
    if (title) title.textContent = 'Добавь работу';
    const quick = document.createElement('div');
    quick.className = 'quick-box';
    quick.innerHTML = `<div class="quick-title">Популярное</div><div class="quick-list">${quickTemplates.map((item) => `<button class="quick-btn" type="button" data-template="${item.serviceId}" data-template-qty="${item.qty}">${item.title}</button>`).join('')}</div>`;
    servicesList.insertAdjacentElement('beforebegin', quick);
    const box = document.createElement('div');
    box.id = 'dropdownBox';
    box.className = 'dropdown-box';
    box.innerHTML = `<div class="dropdown-grid"><label>Категория<select id="workCategory"></select></label><label>Работа<select id="workSelect"></select></label><label>Кол-во<input id="workQty" type="number" min="1" value="1" inputmode="numeric"></label></div><button class="main-btn dropdown-add" id="addWork" type="button">Добавить</button><div class="picked-list" id="pickedList"></div>`;
    servicesList.insertAdjacentElement('beforebegin', box);
    fillCategorySelect();
    fillWorkSelect();
  }

  function fillCategorySelect() {
    const select = $('workCategory');
    if (!select) return;
    select.innerHTML = [`<option value="all">Все работы</option>`, ...groupList().map((group) => `<option value="${group.id}">${group.title.replace('Электрика · ', '')}</option>`)].join('');
  }

  function fillWorkSelect() {
    const category = $('workCategory')?.value || 'all';
    const select = $('workSelect');
    if (!select) return;
    const filtered = serviceList().filter((service) => category === 'all' || service.category === category);
    select.innerHTML = filtered.map((service) => `<option value="${service.id}">${service.title} — ${rub(service.price)}</option>`).join('');
  }

  function setServiceQty(serviceId, qty) {
    const input = document.querySelector(`[data-qty='${serviceId}']`);
    if (!input) return;
    input.value = Math.max(0, money(qty));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    recalc();
    updatePicked();
    updateClientLinks();
    buildAct(false);
  }

  function addWork(serviceId = $('workSelect')?.value, qty = $('workQty')?.value || 1) {
    const qtyToAdd = Math.max(1, money(qty));
    const input = document.querySelector(`[data-qty='${serviceId}']`);
    const current = money(input?.value || 0);
    setServiceQty(serviceId, current + qtyToAdd);
    if ($('workQty')) $('workQty').value = 1;
  }

  function updatePicked() {
    const box = $('pickedList');
    if (!box) return;
    const items = selectedWorks();
    if (!items.length) { box.classList.remove('open'); box.innerHTML = ''; return; }
    box.classList.add('open');
    box.innerHTML = items.map((item) => `<div class="picked-row"><div><div class="picked-title">${item.title}</div><div class="picked-meta">${item.qty} ${item.unit} × ${rub(item.price)}</div></div><div class="picked-sum">${rub(item.subtotal)}</div><button class="picked-remove" type="button" data-remove-work="${item.id}">×</button></div>`).join('');
  }

  function clientText() {
    const total = totals();
    if (!total.works.length) return 'Здравствуйте. Выберите работы для предварительного расчёта.';
    const lines = total.works.map((item) => `${item.title} × ${item.qty} — ${rub(item.subtotal)}`);
    return ['Здравствуйте.', 'Предварительный расчёт:', '', ...lines, '', `Итого ориентировочно: ${rub(total.total)}`, '', 'Точная цена после осмотра. Без согласования работы не выполняются.'].join('\n');
  }

  function createClientActions() {
    const result = document.querySelector('.result');
    if (!result || $('clientActions')) return;
    const wrap = document.createElement('div');
    wrap.id = 'clientActions';
    wrap.className = 'client-actions';
    wrap.innerHTML = `<button class="client-btn primary" id="copyClientText" type="button">Отправить клиенту</button><div class="client-actions-row"><a class="client-btn" id="whatsAppLink" href="#" target="_blank" rel="noopener">WhatsApp</a><a class="client-btn" id="telegramLink" href="#" target="_blank" rel="noopener">Telegram</a></div><div class="client-status" id="clientStatus"></div>`;
    result.appendChild(wrap);
    $('copyClientText')?.addEventListener('click', () => navigator.clipboard.writeText(clientText()).then(() => { $('clientStatus').textContent = 'Текст для клиента скопирован'; setTimeout(() => { $('clientStatus').textContent = ''; }, 1600); }));
    updateClientLinks();
  }

  function updateClientLinks() {
    const text = encodeURIComponent(clientText());
    if ($('whatsAppLink')) $('whatsAppLink').href = `https://wa.me/?text=${text}`;
    if ($('telegramLink')) $('telegramLink').href = `https://t.me/share/url?url=&text=${text}`;
  }

  function createSettingsToggle() {
    const result = document.querySelector('.result');
    if (!result || $('settingsToggle')) return;
    const button = document.createElement('button');
    button.id = 'settingsToggle'; button.type = 'button'; button.className = 'ghost settings-toggle'; button.textContent = 'Доп. настройки';
    result.appendChild(button);
    button.addEventListener('click', () => document.querySelector('.options')?.classList.toggle('open'));
  }

  function createActForm() {
    const notes = document.querySelector('.notes');
    if (!notes || $('actPanel')) return;
    const panel = document.createElement('details');
    panel.className = 'card act-panel'; panel.id = 'actPanel';
    panel.innerHTML = `<summary>Акт выполненных работ</summary><div class="act-content"><div class="act-grid"><label>Номер акта<input id="actNumber" value="${actDefaults.number}"></label><label>Дата<input id="actDate" type="date" value="${actDefaults.date}"></label><label class="wide">Адрес работ<input id="actAddress" placeholder="г. Тверь, ул. ..."></label><label class="wide">Заявленная неисправность<input id="actProblem" placeholder="Например: протекает унитаз"></label><label>Заказчик<input id="actCustomer" placeholder="ФИО заказчика"></label><label>Исполнитель<input id="actExecutor" value="${actDefaults.executor}"></label><label>Телефон<input id="actPhone" value="${actDefaults.phone}"></label><label>Гарантия, дней<input id="actWarranty" type="number" min="0" value="${actDefaults.warranty}"></label><label class="wide">Email клиента<input id="actEmail" type="email" placeholder="client@mail.ru"></label><label class="wide">Рекомендованные работы<textarea id="actRecommended">${actDefaults.recommended}</textarea></label></div><div class="act-buttons"><button class="main-btn" id="buildAct" type="button">Показать акт</button><button class="main-btn" id="printAct" type="button">Печать / PDF</button><button class="main-btn" id="mailAct" type="button">На почту</button><button class="main-btn" id="copyAct" type="button">Скопировать акт</button></div></div>`;
    notes.insertAdjacentElement('beforebegin', panel);
    const preview = document.createElement('section');
    preview.id = 'actPreview'; preview.className = 'card act-preview print-root';
    preview.innerHTML = `<div class="act-preview-head"><div><p class="eyebrow small">Предпросмотр</p><h2>Акт для печати</h2></div><button class="ghost" id="hideAct" type="button">Скрыть</button></div><div class="act-paper-scroll"><div class="act-paper" id="actPaper"></div></div>`;
    panel.insertAdjacentElement('afterend', preview);
  }

  function actPlainText() {
    const total = totals();
    const lines = total.actRows.map((item, index) => `${index + 1}. ${item.title} — ${item.qty} ${item.unit} × ${raw(item.price)} = ${raw(item.subtotal)} руб.`);
    return [`Акт передачи выполненных работ № ${value('actNumber')} от ${formatDate(value('actDate'))} года`, `Адрес: ${value('actAddress') || 'не указан'}`, `Заявленная неисправность: ${value('actProblem') || 'не указана'}`, '', ...lines, '', `Итого работы: ${raw(total.workTotal)} руб.`, `Итого материалы: ${raw(total.materials)} руб.`, `Скидка: ${raw(total.discountValue)} руб.`, `Всего: ${raw(total.total)} руб.`, '', `Заказчик: ${value('actCustomer') || '________________'}`, `Исполнитель: ${value('actExecutor') || '________________'}`, `Гарантия: ${value('actWarranty') || 0} дней`, `Телефон: ${value('actPhone') || ''}`].join('\n');
  }

  function buildAct(show = true) {
    const total = totals();
    const rows = [...total.actRows]; while (rows.length < 16) rows.push(null);
    const recommended = (value('actRecommended') || '').split('\n').map((item) => item.trim()).filter(Boolean);
    const recRows = (recommended.length ? recommended : ['']).map((item, index) => `<tr><td class="act-center">${index + 1}</td><td class="act-red" colspan="4">${item || '&nbsp;'}</td></tr>`).join('');
    const paper = $('actPaper'); if (!paper) return;
    paper.innerHTML = `<h3 class="act-title">Акт передачи выполненных работ № ${value('actNumber') || '____'} от <span class="act-red">${formatDate(value('actDate'))}</span> года</h3><table><tr><td style="width:34%">Адрес выполнения ремонтных работ (полный адрес)</td><td class="act-red act-center">${value('actAddress') || '&nbsp;'}</td></tr><tr><td>Заявленные по заказу неисправности (место проведения ремонта)</td><td class="act-red act-center">${value('actProblem') || '&nbsp;'}</td></tr></table><br><table><tr><th style="width:5%">№</th><th>Наименование</th><th style="width:11%">Кол-во</th><th style="width:14%">Цена за ед.(руб.)</th><th style="width:14%">Сумма (руб.)</th></tr>${rows.map((item, index) => item ? `<tr><td class="act-center">${index + 1}</td><td class="act-red">${item.title}</td><td class="act-red act-center">${item.qty}</td><td class="act-red act-center">${raw(item.price)}</td><td class="act-red act-center">${raw(item.subtotal)}</td></tr>` : `<tr><td class="act-center">${index + 1}</td><td>&nbsp;</td><td></td><td></td><td></td></tr>`).join('')}<tr><td colspan="5" class="act-center">Рекомендованные работы</td></tr>${recRows}</table><table class="act-summary"><tr><td>Итого работы</td><td class="act-red act-right">${raw(total.workTotal)}</td></tr><tr><td>Итого материалы</td><td class="act-red act-right">${raw(total.materials)}</td></tr><tr><td>Скидка</td><td class="act-red act-right">${raw(total.discountValue)}</td></tr><tr><td>Всего</td><td class="act-red act-right">${raw(total.total)}</td></tr></table><div class="act-footer"><p><b>Работы выполнены и согласованы с заказчиком. Оплата произведена в полном объеме.</b></p><p>Заказчик: <span class="act-red">${value('actCustomer') || '________________'}</span> <span class="act-line"></span> Подпись</p><p>Исполнитель: <span class="act-line"></span> Подпись</p><p>Срок гарантии: <span class="act-red">${value('actWarranty') || 0} дней</span> <span style="float:right">НОМЕР ДЛЯ СВЯЗИ: <b class="act-red">${value('actPhone') || ''}</b></span></p></div>`;
    if (show) { $('actPreview')?.classList.add('open'); $('actPreview')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }

  function sendMail() { buildAct(false); const subject = encodeURIComponent(`Акт выполненных работ № ${value('actNumber')}`); const body = encodeURIComponent(actPlainText()); window.location.href = `mailto:${encodeURIComponent(value('actEmail').trim())}?subject=${subject}&body=${body}`; }

  function bind() {
    $('workCategory')?.addEventListener('change', fillWorkSelect);
    $('addWork')?.addEventListener('click', () => addWork());
    $('workQty')?.addEventListener('keydown', (event) => { if (event.key === 'Enter') addWork(); });
    document.addEventListener('click', (event) => {
      const template = event.target.closest('[data-template]'); if (template) addWork(template.dataset.template, template.dataset.templateQty || 1);
      const remove = event.target.closest('[data-remove-work]'); if (remove) setServiceQty(remove.dataset.removeWork, 0);
      if (event.target.matches('[data-plus], [data-minus], #resetBtn')) setTimeout(() => { updatePicked(); updateClientLinks(); }, 0);
    });
    document.addEventListener('input', (event) => { if (event.target.matches('[data-qty], #visitPrice, #minimumPrice, #materialsExtra, #complexity, #urgency, #discount')) setTimeout(() => { updatePicked(); updateClientLinks(); buildAct(false); }, 0); });
    $('buildAct')?.addEventListener('click', () => buildAct(true));
    $('hideAct')?.addEventListener('click', () => $('actPreview')?.classList.remove('open'));
    $('printAct')?.addEventListener('click', () => { buildAct(true); setTimeout(() => window.print(), 250); });
    $('mailAct')?.addEventListener('click', sendMail);
    $('copyAct')?.addEventListener('click', () => navigator.clipboard.writeText(actPlainText()).then(() => { const button = $('copyAct'); button.textContent = 'Акт скопирован'; setTimeout(() => { button.textContent = 'Скопировать акт'; }, 1600); }));
    ['actNumber','actDate','actAddress','actProblem','actCustomer','actExecutor','actPhone','actWarranty','actRecommended'].forEach((id) => $(id)?.addEventListener('input', () => buildAct(false)));
  }

  function init() { addStyles(); setTimeout(() => { createModeSwitch(); createDropdown(); createClientActions(); createSettingsToggle(); createActForm(); bind(); updatePicked(); updateClientLinks(); buildAct(false); }, 0); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();