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

  function formatDate(value) {
    const date = value ? new Date(`${value}T00:00:00`) : new Date();
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  function field(id) {
    return document.getElementById(id);
  }

  function val(id) {
    return field(id)?.value || '';
  }

  function num(id, fallback = 0) {
    const value = Number(field(id)?.value);
    return Number.isFinite(value) && value >= 0 ? value : fallback;
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

    const actRows = works.map((item) => ({
      title: item.title,
      qty: item.qty,
      unit: item.unit,
      price: money(item.price),
      subtotal: money(item.subtotal)
    }));

    if (works.length && visit > 0) {
      actRows.push({ title: 'Выезд мастера', qty: 1, unit: 'работа', price: visit, subtotal: visit });
    }

    if (works.length && coefficientExtra > 0) {
      actRows.push({ title: 'Доплата за сложность / срочность', qty: 1, unit: 'работа', price: coefficientExtra, subtotal: coefficientExtra });
    }

    if (works.length && minimumExtra > 0) {
      actRows.push({ title: 'Доплата до минимального заказа', qty: 1, unit: 'работа', price: minimumExtra, subtotal: minimumExtra });
    }

    const workTotal = actRows.reduce((sum, item) => sum + money(item.subtotal), 0);

    return {
      works,
      actRows,
      workTotal,
      materials,
      discountValue,
      total,
      selectedSubtotal,
      visit,
      coefficientExtra,
      minimumExtra
    };
  }

  function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .act-panel{margin-top:22px;padding:22px;display:grid;gap:16px}.act-panel h2{margin:0}.act-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.act-grid .wide{grid-column:1/-1}.act-panel textarea{min-height:92px;resize:vertical}.act-buttons{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.act-buttons .main-btn{padding:13px}.act-preview{display:none;margin-top:22px;padding:22px}.act-preview.open{display:block}.act-preview-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:16px}.act-preview-head h2{margin:0}.act-paper-scroll{width:100%;overflow-x:auto;padding-bottom:4px}.act-paper{background:#fff;color:#111;width:794px;min-width:794px;margin:0 auto;padding:28px 34px;font-family:'Times New Roman',serif;font-size:14px;box-shadow:0 20px 60px rgba(0,0,0,.35)}.act-paper table{width:100%;border-collapse:collapse}.act-paper td,.act-paper th{border:1px solid #111;padding:3px 6px;vertical-align:middle}.act-title{text-align:center;margin:0 0 24px;font-size:16px;font-weight:400}.act-red{color:#d11}.act-center{text-align:center}.act-right{text-align:right}.act-summary{width:36%;margin-left:auto}.act-line{border-bottom:1px solid #111;display:inline-block;min-width:230px}.act-footer{margin-top:12px;font-size:13px}.act-muted{color:#334155}
      @media(max-width:760px){.act-grid,.act-buttons{grid-template-columns:1fr}.act-preview-head{display:grid}}
      @media print{body{background:#fff!important}.hero,.layout,.notes,.act-panel,.editor,.act-preview-head{display:none!important}.page{width:100%!important;margin:0!important;padding:0!important}.act-preview{display:block!important;margin:0!important;padding:0!important;background:#fff!important;border:0!important;box-shadow:none!important}.act-paper-scroll{overflow:visible!important;padding:0!important}.act-paper{box-shadow:none!important;width:100%!important;min-width:0!important;padding:0!important}@page{size:A4;margin:12mm}}
    `;
    document.head.appendChild(style);
  }

  function createForm() {
    const notes = document.querySelector('.notes');
    const panel = document.createElement('section');
    panel.className = 'card act-panel';
    panel.innerHTML = `
      <div><p class="eyebrow small">Дополнительно</p><h2>Акт выполненных работ</h2></div>
      <div class="act-grid">
        <label>Номер акта<input id="actNumber" value="${actState.number}"></label>
        <label>Дата<input id="actDate" type="date" value="${actState.date}"></label>
        <label class="wide">Адрес работ<input id="actAddress" placeholder="г. Тверь, ул. ..."></label>
        <label class="wide">Заявленная неисправность<input id="actProblem" placeholder="Например: протекает унитаз"></label>
        <label>Заказчик<input id="actCustomer" placeholder="ФИО заказчика"></label>
        <label>Исполнитель<input id="actExecutor" value="${actState.executor}"></label>
        <label>Телефон для связи<input id="actPhone" value="${actState.phone}"></label>
        <label>Гарантия, дней<input id="actWarranty" type="number" min="0" value="${actState.warranty}"></label>
        <label class="wide">Email клиента<input id="actEmail" type="email" placeholder="client@mail.ru"></label>
        <label class="wide">Рекомендованные работы<textarea id="actRecommended">${actState.recommended}</textarea></label>
      </div>
      <div class="act-buttons">
        <button class="main-btn" id="buildAct" type="button">Показать акт</button>
        <button class="main-btn" id="printAct" type="button">Печать / PDF</button>
        <button class="main-btn" id="mailAct" type="button">На почту</button>
        <button class="main-btn" id="copyAct" type="button">Скопировать акт</button>
      </div>
    `;
    notes?.insertAdjacentElement('beforebegin', panel);

    const preview = document.createElement('section');
    preview.className = 'card act-preview print-root';
    preview.id = 'actPreview';
    preview.innerHTML = `
      <div class="act-preview-head">
        <div><p class="eyebrow small">Предпросмотр</p><h2>Акт для печати</h2></div>
        <button class="ghost" id="hideAct" type="button">Скрыть</button>
      </div>
      <div class="act-paper-scroll"><div class="act-paper" id="actPaper"></div></div>
    `;
    panel.insertAdjacentElement('afterend', preview);
  }

  function actPlainText() {
    const totals = getActTotals();
    const lines = totals.actRows.map((item, index) => `${index + 1}. ${item.title} — ${item.qty} ${item.unit} × ${rub(item.price)} = ${rub(item.subtotal)} руб.`);
    return [
      `Акт передачи выполненных работ № ${val('actNumber')} от ${formatDate(val('actDate'))} года`,
      `Адрес: ${val('actAddress') || 'не указан'}`,
      `Заявленная неисправность: ${val('actProblem') || 'не указана'}`,
      '',
      ...lines,
      '',
      `Итого работы: ${rub(totals.workTotal)} руб.`,
      `Итого материалы: ${rub(totals.materials)} руб.`,
      `Скидка: ${rub(totals.discountValue)} руб.`,
      `Всего: ${rub(totals.total)} руб.`,
      '',
      `Заказчик: ${val('actCustomer') || '________________'}`,
      `Исполнитель: ${val('actExecutor') || '________________'}`,
      `Гарантия: ${val('actWarranty') || 0} дней`,
      `Телефон: ${val('actPhone') || ''}`
    ].join('\n');
  }

  function buildAct(show = true) {
    const totals = getActTotals();
    const rows = [...totals.actRows];
    while (rows.length < 16) rows.push(null);

    const recommended = (val('actRecommended') || '').split('\n').map((item) => item.trim()).filter(Boolean);
    const recRows = (recommended.length ? recommended : ['']).map((item, index) => `<tr><td class="act-center">${index + 1}</td><td class="act-red" colspan="4">${item || '&nbsp;'}</td></tr>`).join('');

    const paper = field('actPaper');
    if (!paper) return;

    paper.innerHTML = `
      <h3 class="act-title">Акт передачи выполненных работ № ${val('actNumber') || '____'} от <span class="act-red">${formatDate(val('actDate'))}</span> года</h3>
      <table>
        <tr><td style="width:34%">Адрес выполнения ремонтных работ (полный адрес)</td><td class="act-red act-center">${val('actAddress') || '&nbsp;'}</td></tr>
        <tr><td>Заявленные по заказу неисправности (место проведения ремонта)</td><td class="act-red act-center">${val('actProblem') || '&nbsp;'}</td></tr>
      </table>
      <br>
      <table>
        <tr><th style="width:5%">№</th><th>Наименование</th><th style="width:11%">Кол-во</th><th style="width:14%">Цена за ед.(руб.)</th><th style="width:14%">Сумма (руб.)</th></tr>
        ${rows.map((item, index) => item ? `<tr><td class="act-center">${index + 1}</td><td class="act-red">${item.title}</td><td class="act-red act-center">${item.qty}</td><td class="act-red act-center">${rub(item.price)}</td><td class="act-red act-center">${rub(item.subtotal)}</td></tr>` : `<tr><td class="act-center">${index + 1}</td><td>&nbsp;</td><td></td><td></td><td></td></tr>`).join('')}
        <tr><td colspan="5" class="act-center">Рекомендованные работы</td></tr>
        ${recRows}
      </table>
      <table class="act-summary">
        <tr><td>Итого работы</td><td class="act-red act-right">${rub(totals.workTotal)}</td></tr>
        <tr><td>Итого материалы</td><td class="act-red act-right">${rub(totals.materials)}</td></tr>
        <tr><td>Скидка</td><td class="act-red act-right">${rub(totals.discountValue)}</td></tr>
        <tr><td>Всего</td><td class="act-red act-right">${rub(totals.total)}</td></tr>
      </table>
      <div class="act-footer">
        <p><b>Работы выполнены и согласованы с заказчиком. Оплата произведена в полном объеме.</b></p>
        <p>Заказчик: <span class="act-red">${val('actCustomer') || '________________'}</span> <span class="act-line"></span> Подпись</p>
        <p>Исполнитель: <span class="act-line"></span> Подпись</p>
        <p>Срок гарантии: <span class="act-red">${val('actWarranty') || 0} дней</span> <span style="float:right">НОМЕР ДЛЯ СВЯЗИ: <b class="act-red">${val('actPhone') || ''}</b></span></p>
      </div>
    `;

    if (show) {
      field('actPreview')?.classList.add('open');
      field('actPreview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function sendMail() {
    buildAct(false);
    const to = val('actEmail').trim();
    const subject = encodeURIComponent(`Акт выполненных работ № ${val('actNumber')}`);
    const body = encodeURIComponent(actPlainText());
    window.location.href = `mailto:${encodeURIComponent(to)}?subject=${subject}&body=${body}`;
  }

  function bind() {
    field('buildAct')?.addEventListener('click', () => buildAct(true));
    field('hideAct')?.addEventListener('click', () => field('actPreview')?.classList.remove('open'));
    field('printAct')?.addEventListener('click', () => { buildAct(true); setTimeout(() => window.print(), 250); });
    field('mailAct')?.addEventListener('click', sendMail);
    field('copyAct')?.addEventListener('click', () => {
      navigator.clipboard.writeText(actPlainText()).then(() => {
        const button = field('copyAct');
        button.textContent = 'Акт скопирован';
        setTimeout(() => { button.textContent = 'Скопировать акт'; }, 1600);
      });
    });

    ['actNumber','actDate','actAddress','actProblem','actCustomer','actExecutor','actPhone','actWarranty','actRecommended'].forEach((id) => {
      field(id)?.addEventListener('input', () => buildAct(false));
    });

    document.addEventListener('input', (event) => {
      if (event.target.matches('[data-qty], #visitPrice, #minimumPrice, #materialsExtra, #complexity, #urgency, #discount')) buildAct(false);
    });

    document.addEventListener('click', (event) => {
      if (event.target.matches('[data-plus], [data-minus], #resetBtn')) setTimeout(() => buildAct(false), 0);
    });
  }

  function init() {
    addStyles();
    createForm();
    bind();
    buildAct(false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
