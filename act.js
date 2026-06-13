(() => {
  const actState = {
    number: `УР/07-${String(Math.floor(Date.now() / 1000)).slice(-6)}`,
    date: new Date().toISOString().slice(0, 10),
    address: '',
    problem: '',
    customer: '',
    executor: 'Владимир',
    phone: '+79001189603',
    warranty: 30,
    email: '',
    recommended: 'Замена крана, отсекающего унитаз\nЗамена гибкой подводки на смеситель в ванне'
  };

  const rub = (value) => String(Math.round(Number(value) || 0));
  const money = (value) => Math.round(Number(value) || 0);
  const field = (id) => document.getElementById(id);
  const val = (id) => field(id)?.value || '';

  function num(id, fallback = 0) {
    const value = Number(field(id)?.value);
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  }

  function formatDate(value) {
    const date = value ? new Date(`${value}T00:00:00`) : new Date();
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  function selectedWorks() {
    if (typeof selected === 'function') return selected();
    return [];
  }

  function getActTotals() {
    const works = selectedWorks();
    const selectedSubtotal = works.reduce((sum, item) => sum + money(item.subtotal), 0);
    const visit = num('visitPrice');
    const materials = num('materialsExtra');
    const minimum = num('minimumPrice');
    const complexity = Number(field('complexity')?.value || 1);
    const urgency = Number(field('urgency')?.value || 1);
    const discountPercent = Math.min(50, num('discount'));
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
      body.minimal-ui{background:#0b1120!important}body.minimal-ui .page{width:min(1040px,calc(100% - 24px));padding:18px 0 34px}body.minimal-ui .hero{padding:22px!important;margin-bottom:14px!important;border-radius:20px!important;box-shadow:none!important}body.minimal-ui .hero:after,body.minimal-ui .badges{display:none!important}body.minimal-ui h1{font-size:clamp(1.75rem,4vw,3rem)!important;letter-spacing:-.04em!important}body.minimal-ui .subtitle{max-width:620px;font-size:.98rem!important;line-height:1.45!important;margin-bottom:0!important}body.minimal-ui .layout{grid-template-columns:minmax(0,1.4fr) minmax(300px,.6fr);gap:14px!important}body.minimal-ui .card{border-radius:18px!important;box-shadow:none!important;background:rgba(255,255,255,.065)!important}body.minimal-ui .services,body.minimal-ui .options,body.minimal-ui .result{padding:16px!important}body.minimal-ui .head{margin-bottom:10px!important}body.minimal-ui .head h2{font-size:1.25rem!important}body.minimal-ui .actions-top{gap:8px!important}body.minimal-ui .toolbar{margin-top:12px!important;gap:7px!important}body.minimal-ui .chip,body.minimal-ui .ghost{padding:7px 10px!important;font-size:.84rem!important;border-radius:999px!important}body.minimal-ui .group-list{gap:9px!important;margin-top:12px!important}body.minimal-ui .group{border-radius:15px!important;background:rgba(15,23,42,.35)!important}body.minimal-ui .group-head{padding:10px 12px!important;border-bottom:1px solid rgba(255,255,255,.06)!important;cursor:pointer!important;align-items:center!important}body.minimal-ui .group-desc,body.minimal-ui .group-count{display:none!important}body.minimal-ui .group-title{font-size:.98rem!important}body.minimal-ui .group-head:after{content:'−';width:24px;height:24px;display:grid;place-items:center;border-radius:50%;background:rgba(255,255,255,.08);color:var(--muted);font-weight:900;flex:0 0 auto}body.minimal-ui .group.collapsed .group-head:after{content:'+'}body.minimal-ui .group.collapsed .group-body{display:none!important}body.minimal-ui .group-body{gap:6px!important;padding:8px!important}body.minimal-ui .service{grid-template-columns:1fr auto auto!important;gap:10px!important;padding:8px 10px!important;border-radius:12px!important;background:rgba(2,6,23,.32)!important}body.minimal-ui .service .icon{display:none!important}body.minimal-ui .service .meta{display:none!important}body.minimal-ui .service .title{font-size:.93rem!important;font-weight:760!important}body.minimal-ui .price{font-size:.88rem!important;text-align:right!important;white-space:nowrap!important}body.minimal-ui .qty{gap:4px!important}body.minimal-ui .qty button{width:28px!important;height:28px!important;border-radius:9px!important}body.minimal-ui .qty input{width:42px!important;padding:7px 2px!important;border-radius:9px!important}body.minimal-ui .side{gap:14px!important}body.minimal-ui .options{display:none!important}body.minimal-ui .options.open{display:grid!important}body.minimal-ui .result p{margin-bottom:6px!important}body.minimal-ui .result strong{font-size:2.45rem!important;margin-bottom:8px!important}body.minimal-ui #details{display:none!important}.mini-selected{display:none;margin:10px 0 14px;border-top:1px solid rgba(255,255,255,.1);padding-top:10px}.mini-selected.open{display:grid;gap:7px}.mini-row{display:grid;grid-template-columns:1fr auto;gap:8px;font-size:.92rem;color:var(--muted)}.mini-row b{color:var(--text);font-weight:750}.mini-empty{color:var(--muted2);font-size:.92rem}.mini-settings-toggle{margin-top:10px;width:100%;background:rgba(255,255,255,.08)!important;color:var(--muted)!important;border:1px solid rgba(255,255,255,.14)!important}.act-panel{margin-top:22px;padding:18px;display:grid;gap:14px}.act-panel h2{margin:0}.act-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.act-grid .wide{grid-column:1/-1}.act-panel textarea{min-height:82px;resize:vertical}.act-buttons{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.act-buttons .main-btn{padding:12px}.act-preview{display:none;margin-top:18px;padding:18px}.act-preview.open{display:block}.act-preview-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:14px}.act-paper-scroll{width:100%;overflow-x:auto}.act-paper{background:#fff;color:#111;width:794px;min-width:794px;margin:0 auto;padding:28px 34px;font-family:'Times New Roman',serif;font-size:14px;box-shadow:0 20px 60px rgba(0,0,0,.35)}.act-paper table{width:100%;border-collapse:collapse}.act-paper td,.act-paper th{border:1px solid #111;padding:3px 6px;vertical-align:middle}.act-title{text-align:center;margin:0 0 24px;font-size:16px;font-weight:400}.act-red{color:#d11}.act-center{text-align:center}.act-right{text-align:right}.act-summary{width:36%;margin-left:auto}.act-line{border-bottom:1px solid #111;display:inline-block;min-width:230px}.act-footer{margin-top:12px;font-size:13px}
      @media(max-width:940px){body.minimal-ui .layout{grid-template-columns:1fr!important}body.minimal-ui .side{position:static!important}}
      @media(max-width:760px){.act-grid,.act-buttons{grid-template-columns:1fr}.act-preview-head{display:grid}body.minimal-ui .service{grid-template-columns:1fr auto!important}body.minimal-ui .price{grid-column:1/2;text-align:left!important}body.minimal-ui .qty{grid-column:2/3;grid-row:1/3}}
      @media print{body{background:#fff!important}.hero,.layout,.notes,.act-panel,.editor,.act-preview-head{display:none!important}.page{width:100%!important;margin:0!important;padding:0!important}.act-preview{display:block!important;margin:0!important;padding:0!important;background:#fff!important;border:0!important;box-shadow:none!important}.act-paper-scroll{overflow:visible!important;padding:0!important}.act-paper{box-shadow:none!important;width:100%!important;min-width:0!important;padding:0!important}@page{size:A4;margin:12mm}}
    `;
    document.head.appendChild(style);
  }

  function createMinimalLayer() {
    document.body.classList.add('minimal-ui');
    const subtitle = document.querySelector('.subtitle');
    if (subtitle) subtitle.textContent = 'Выбери категорию, добавь работы и сразу получи итог. Акт — ниже.';
    const result = document.querySelector('.result');
    if (result && !field('miniSelected')) {
      const mini = document.createElement('div');
      mini.id = 'miniSelected';
      mini.className = 'mini-selected';
      mini.innerHTML = '<div class="mini-empty">Пока ничего не выбрано</div>';
      field('details')?.insertAdjacentElement('afterend', mini);
      const settingsButton = document.createElement('button');
      settingsButton.type = 'button';
      settingsButton.className = 'ghost mini-settings-toggle';
      settingsButton.id = 'settingsToggle';
      settingsButton.textContent = 'Доп. настройки';
      result.appendChild(settingsButton);
      settingsButton.addEventListener('click', () => document.querySelector('.options')?.classList.toggle('open'));
    }
    document.querySelectorAll('.group-head').forEach((head) => {
      if (head.dataset.bound === '1') return;
      head.dataset.bound = '1';
      head.addEventListener('click', () => head.closest('.group')?.classList.toggle('collapsed'));
    });
    if (typeof applyFilter === 'function' && !document.body.dataset.initialFilterDone) {
      document.body.dataset.initialFilterDone = '1';
      applyFilter('points');
    }
  }

  function updateMiniSelected() {
    const box = field('miniSelected');
    if (!box) return;
    const works = selectedWorks();
    if (!works.length) {
      box.classList.remove('open');
      box.innerHTML = '<div class="mini-empty">Пока ничего не выбрано</div>';
      return;
    }
    box.classList.add('open');
    box.innerHTML = works.map((item) => `<div class="mini-row"><span><b>${item.title}</b> × ${item.qty}</span><span>${rub(item.subtotal)} ₽</span></div>`).join('');
  }

  function createForm() {
    const notes = document.querySelector('.notes');
    const panel = document.createElement('section');
    panel.className = 'card act-panel';
    panel.innerHTML = `<div><p class="eyebrow small">Документы</p><h2>Акт выполненных работ</h2></div><div class="act-grid"><label>Номер акта<input id="actNumber" value="${actState.number}"></label><label>Дата<input id="actDate" type="date" value="${actState.date}"></label><label class="wide">Адрес работ<input id="actAddress" placeholder="г. Тверь, ул. ..."></label><label class="wide">Заявленная неисправность<input id="actProblem" placeholder="Например: протекает унитаз"></label><label>Заказчик<input id="actCustomer" placeholder="ФИО заказчика"></label><label>Исполнитель<input id="actExecutor" value="${actState.executor}"></label><label>Телефон<input id="actPhone" value="${actState.phone}"></label><label>Гарантия, дней<input id="actWarranty" type="number" min="0" value="${actState.warranty}"></label><label class="wide">Email клиента<input id="actEmail" type="email" placeholder="client@mail.ru"></label><label class="wide">Рекомендованные работы<textarea id="actRecommended">${actState.recommended}</textarea></label></div><div class="act-buttons"><button class="main-btn" id="buildAct" type="button">Показать акт</button><button class="main-btn" id="printAct" type="button">Печать / PDF</button><button class="main-btn" id="mailAct" type="button">На почту</button><button class="main-btn" id="copyAct" type="button">Скопировать акт</button></div>`;
    notes?.insertAdjacentElement('beforebegin', panel);
    const preview = document.createElement('section');
    preview.className = 'card act-preview print-root';
    preview.id = 'actPreview';
    preview.innerHTML = `<div class="act-preview-head"><div><p class="eyebrow small">Предпросмотр</p><h2>Акт для печати</h2></div><button class="ghost" id="hideAct" type="button">Скрыть</button></div><div class="act-paper-scroll"><div class="act-paper" id="actPaper"></div></div>`;
    panel.insertAdjacentElement('afterend', preview);
  }

  function actPlainText() {
    const totals = getActTotals();
    const lines = totals.actRows.map((item, index) => `${index + 1}. ${item.title} — ${item.qty} ${item.unit} × ${rub(item.price)} = ${rub(item.subtotal)} руб.`);
    return [`Акт передачи выполненных работ № ${val('actNumber')} от ${formatDate(val('actDate'))} года`, `Адрес: ${val('actAddress') || 'не указан'}`, `Заявленная неисправность: ${val('actProblem') || 'не указана'}`, '', ...lines, '', `Итого работы: ${rub(totals.workTotal)} руб.`, `Итого материалы: ${rub(totals.materials)} руб.`, `Скидка: ${rub(totals.discountValue)} руб.`, `Всего: ${rub(totals.total)} руб.`, '', `Заказчик: ${val('actCustomer') || '________________'}`, `Исполнитель: ${val('actExecutor') || '________________'}`, `Гарантия: ${val('actWarranty') || 0} дней`, `Телефон: ${val('actPhone') || ''}`].join('\n');
  }

  function buildAct(show = true) {
    const totals = getActTotals();
    const rows = [...totals.actRows];
    while (rows.length < 16) rows.push(null);
    const recommended = (val('actRecommended') || '').split('\n').map((item) => item.trim()).filter(Boolean);
    const recRows = (recommended.length ? recommended : ['']).map((item, index) => `<tr><td class="act-center">${index + 1}</td><td class="act-red" colspan="4">${item || '&nbsp;'}</td></tr>`).join('');
    const paper = field('actPaper');
    if (!paper) return;
    paper.innerHTML = `<h3 class="act-title">Акт передачи выполненных работ № ${val('actNumber') || '____'} от <span class="act-red">${formatDate(val('actDate'))}</span> года</h3><table><tr><td style="width:34%">Адрес выполнения ремонтных работ (полный адрес)</td><td class="act-red act-center">${val('actAddress') || '&nbsp;'}</td></tr><tr><td>Заявленные по заказу неисправности (место проведения ремонта)</td><td class="act-red act-center">${val('actProblem') || '&nbsp;'}</td></tr></table><br><table><tr><th style="width:5%">№</th><th>Наименование</th><th style="width:11%">Кол-во</th><th style="width:14%">Цена за ед.(руб.)</th><th style="width:14%">Сумма (руб.)</th></tr>${rows.map((item, index) => item ? `<tr><td class="act-center">${index + 1}</td><td class="act-red">${item.title}</td><td class="act-red act-center">${item.qty}</td><td class="act-red act-center">${rub(item.price)}</td><td class="act-red act-center">${rub(item.subtotal)}</td></tr>` : `<tr><td class="act-center">${index + 1}</td><td>&nbsp;</td><td></td><td></td><td></td></tr>`).join('')}<tr><td colspan="5" class="act-center">Рекомендованные работы</td></tr>${recRows}</table><table class="act-summary"><tr><td>Итого работы</td><td class="act-red act-right">${rub(totals.workTotal)}</td></tr><tr><td>Итого материалы</td><td class="act-red act-right">${rub(totals.materials)}</td></tr><tr><td>Скидка</td><td class="act-red act-right">${rub(totals.discountValue)}</td></tr><tr><td>Всего</td><td class="act-red act-right">${rub(totals.total)}</td></tr></table><div class="act-footer"><p><b>Работы выполнены и согласованы с заказчиком. Оплата произведена в полном объеме.</b></p><p>Заказчик: <span class="act-red">${val('actCustomer') || '________________'}</span> <span class="act-line"></span> Подпись</p><p>Исполнитель: <span class="act-line"></span> Подпись</p><p>Срок гарантии: <span class="act-red">${val('actWarranty') || 0} дней</span> <span style="float:right">НОМЕР ДЛЯ СВЯЗИ: <b class="act-red">${val('actPhone') || ''}</b></span></p></div>`;
    if (show) {
      field('actPreview')?.classList.add('open');
      field('actPreview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function sendMail() {
    buildAct(false);
    const subject = encodeURIComponent(`Акт выполненных работ № ${val('actNumber')}`);
    const body = encodeURIComponent(actPlainText());
    window.location.href = `mailto:${encodeURIComponent(val('actEmail').trim())}?subject=${subject}&body=${body}`;
  }

  function bind() {
    field('buildAct')?.addEventListener('click', () => buildAct(true));
    field('hideAct')?.addEventListener('click', () => field('actPreview')?.classList.remove('open'));
    field('printAct')?.addEventListener('click', () => { buildAct(true); setTimeout(() => window.print(), 250); });
    field('mailAct')?.addEventListener('click', sendMail);
    field('copyAct')?.addEventListener('click', () => navigator.clipboard.writeText(actPlainText()).then(() => { const button = field('copyAct'); button.textContent = 'Акт скопирован'; setTimeout(() => { button.textContent = 'Скопировать акт'; }, 1600); }));
    ['actNumber','actDate','actAddress','actProblem','actCustomer','actExecutor','actPhone','actWarranty','actRecommended'].forEach((id) => field(id)?.addEventListener('input', () => buildAct(false)));
    document.addEventListener('input', (event) => {
      if (event.target.matches('[data-qty], #visitPrice, #minimumPrice, #materialsExtra, #complexity, #urgency, #discount')) { updateMiniSelected(); buildAct(false); }
    });
    document.addEventListener('click', (event) => {
      if (event.target.matches('[data-plus], [data-minus], #resetBtn, .chip')) setTimeout(() => { createMinimalLayer(); updateMiniSelected(); buildAct(false); }, 0);
    });
  }

  function init() {
    addStyles();
    createForm();
    bind();
    setTimeout(() => { createMinimalLayer(); updateMiniSelected(); buildAct(false); }, 0);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
