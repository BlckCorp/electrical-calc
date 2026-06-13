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
  const formatDate = (value) => {
    const date = value ? new Date(`${value}T00:00:00`) : new Date();
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .act-panel { margin-top: 22px; }
      .act-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
      .act-grid .wide { grid-column: 1 / -1; }
      .act-buttons { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-top: 14px; }
      .act-preview { margin-top: 22px; }
      .act-paper { background: #fff; color: #111; width: min(794px, 100%); margin: 0 auto; padding: 28px 34px; font-family: 'Times New Roman', serif; font-size: 14px; box-shadow: 0 20px 60px rgba(0,0,0,.35); }
      .act-paper table { width: 100%; border-collapse: collapse; }
      .act-paper td, .act-paper th { border: 1px solid #111; padding: 3px 6px; vertical-align: middle; }
      .act-title { text-align: center; margin: 0 0 24px; font-size: 16px; font-weight: 400; }
      .act-red { color: #d11; }
      .act-center { text-align: center; }
      .act-right { text-align: right; }
      .act-summary { width: 36%; margin-left: auto; }
      .act-line { border-bottom: 1px solid #111; display: inline-block; min-width: 230px; }
      .act-footer { margin-top: 12px; font-size: 13px; }
      @media (max-width: 760px) { .act-grid, .act-buttons { grid-template-columns: 1fr; } .act-paper { padding: 16px; font-size: 12px; overflow: auto; } .act-summary { width: 100%; } }
      @media print { body { background: white !important; } body > *:not(.print-root) { display: none !important; } .print-root { display: block !important; } .act-paper { box-shadow: none; width: 100%; padding: 0; } @page { size: A4; margin: 12mm; } }
    `;
    document.head.appendChild(style);
  }

  function selectedWorks() {
    if (typeof selected === 'function') return selected();
    return [];
  }

  function totals() {
    if (typeof calculate === 'function') return calculate();
    return { sel: [], total: 0, work: 0, mat: 0, discountValue: 0 };
  }

  function val(id) {
    return document.getElementById(id)?.value || '';
  }

  function createForm() {
    const notes = document.querySelector('.notes');
    const panel = document.createElement('section');
    panel.className = 'card act-panel';
    panel.innerHTML = `
      <p class="eyebrow small">Дополнительно</p>
      <h2>Акт выполненных работ</h2>
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
        <button class="main-btn" id="buildAct" type="button">Заполнить акт</button>
        <button class="main-btn" id="printAct" type="button">Печать / PDF</button>
        <button class="main-btn" id="mailAct" type="button">На почту</button>
        <button class="main-btn" id="copyAct" type="button">Скопировать акт</button>
      </div>
    `;
    notes?.insertAdjacentElement('beforebegin', panel);

    const preview = document.createElement('section');
    preview.className = 'act-preview print-root';
    preview.innerHTML = '<div class="act-paper" id="actPaper"></div>';
    panel.insertAdjacentElement('afterend', preview);
  }

  function actPlainText() {
    const r = totals();
    const works = selectedWorks();
    const lines = works.map((item, index) => `${index + 1}. ${item.title} — ${item.qty} ${item.unit} × ${rub(item.price)} = ${rub(item.subtotal)} руб.`);
    return [
      `Акт передачи выполненных работ № ${val('actNumber')} от ${formatDate(val('actDate'))} года`,
      `Адрес: ${val('actAddress') || 'не указан'}`,
      `Заявленная неисправность: ${val('actProblem') || 'не указана'}`,
      '',
      ...lines,
      '',
      `Итого работы: ${rub(r.work)} руб.`,
      `Итого материалы: ${rub(r.mat)} руб.`,
      `Всего: ${rub(r.total)} руб.`,
      '',
      `Заказчик: ${val('actCustomer') || '________________'}`,
      `Исполнитель: ${val('actExecutor') || '________________'}`,
      `Гарантия: ${val('actWarranty') || 0} дней`,
      `Телефон: ${val('actPhone') || ''}`
    ].join('\n');
  }

  function buildAct() {
    const r = totals();
    const works = selectedWorks();
    const rows = [...works];
    while (rows.length < 16) rows.push(null);

    const recommended = (val('actRecommended') || '').split('\n').map((item) => item.trim()).filter(Boolean);
    const recRows = (recommended.length ? recommended : ['']).map((item, index) => `
      <tr><td class="act-center">${index + 1}</td><td class="act-red" colspan="4">${item || '&nbsp;'}</td></tr>
    `).join('');

    const paper = document.getElementById('actPaper');
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
        ${rows.map((item, index) => item ? `
          <tr><td class="act-center">${index + 1}</td><td class="act-red">${item.title}</td><td class="act-red act-center">${item.qty}</td><td class="act-red act-center">${rub(item.price)}</td><td class="act-red act-center">${rub(item.subtotal)}</td></tr>
        ` : `<tr><td class="act-center">${index + 1}</td><td>&nbsp;</td><td></td><td></td><td></td></tr>`).join('')}
        <tr><td colspan="5" class="act-center">Рекомендованные работы</td></tr>
        ${recRows}
      </table>
      <table class="act-summary">
        <tr><td>Итого работы</td><td class="act-red act-right">${rub(r.work)}</td></tr>
        <tr><td>Итого материалы</td><td class="act-red act-right">${rub(r.mat)}</td></tr>
        <tr><td>Скидка</td><td class="act-red act-right">${rub(r.discountValue)}</td></tr>
        <tr><td>Всего</td><td class="act-red act-right">${rub(r.total)}</td></tr>
      </table>
      <div class="act-footer">
        <p><b>Работы выполнены и согласованы с заказчиком. Оплата произведена в полном объеме.</b></p>
        <p>Заказчик: <span class="act-red">${val('actCustomer') || '________________'}</span> <span class="act-line"></span> Подпись</p>
        <p>Исполнитель: <span class="act-line"></span> Подпись</p>
        <p>Срок гарантии: <span class="act-red">${val('actWarranty') || 0} дней</span> <span style="float:right">НОМЕР ДЛЯ СВЯЗИ: <b class="act-red">${val('actPhone') || ''}</b></span></p>
      </div>
    `;
  }

  function sendMail() {
    buildAct();
    const to = val('actEmail').trim();
    const subject = encodeURIComponent(`Акт выполненных работ № ${val('actNumber')}`);
    const body = encodeURIComponent(actPlainText());
    window.location.href = `mailto:${encodeURIComponent(to)}?subject=${subject}&body=${body}`;
  }

  function bind() {
    document.getElementById('buildAct')?.addEventListener('click', buildAct);
    document.getElementById('printAct')?.addEventListener('click', () => { buildAct(); window.print(); });
    document.getElementById('mailAct')?.addEventListener('click', sendMail);
    document.getElementById('copyAct')?.addEventListener('click', () => {
      navigator.clipboard.writeText(actPlainText()).then(() => {
        const btn = document.getElementById('copyAct');
        btn.textContent = 'Акт скопирован';
        setTimeout(() => { btn.textContent = 'Скопировать акт'; }, 1600);
      });
    });
    ['actNumber','actDate','actAddress','actProblem','actCustomer','actExecutor','actPhone','actWarranty','actRecommended'].forEach((id) => {
      document.getElementById(id)?.addEventListener('input', buildAct);
    });
  }

  function init() {
    addStyles();
    createForm();
    bind();
    buildAct();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
