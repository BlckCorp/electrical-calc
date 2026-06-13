(() => {
  const byId = (id) => document.getElementById(id);
  const money = (value) => Math.round(Number(value) || 0);
  const format = (value) => `${money(value).toLocaleString('ru-RU')} ₽`;

  function getServices() {
    return typeof services !== 'undefined' && Array.isArray(services) ? services : [];
  }

  function getGroups() {
    return typeof groups !== 'undefined' && Array.isArray(groups) ? groups : [];
  }

  function getSelected() {
    return typeof selected === 'function' ? selected() : [];
  }

  function runCalculate() {
    if (typeof calculate === 'function') calculate();
    document.dispatchEvent(new Event('dropdown-calc-updated'));
  }

  function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      body.dropdown-mode .toolbar,
      body.dropdown-mode #servicesList {
        display: none !important;
      }

      body.dropdown-mode .head {
        margin-bottom: 12px !important;
      }

      .dropdown-work-card {
        display: grid;
        gap: 12px;
        margin-top: 12px;
      }

      .dropdown-work-grid {
        display: grid;
        grid-template-columns: 1fr 1.4fr 92px;
        gap: 10px;
        align-items: end;
      }

      .dropdown-work-grid label {
        gap: 6px;
      }

      .dropdown-work-grid select,
      .dropdown-work-grid input {
        min-height: 46px;
      }

      .dropdown-add {
        min-height: 46px;
      }

      .dropdown-picked {
        display: none;
        gap: 8px;
        margin-top: 4px;
        padding-top: 12px;
        border-top: 1px solid rgba(255,255,255,.1);
      }

      .dropdown-picked.open {
        display: grid;
      }

      .picked-row {
        display: grid;
        grid-template-columns: 1fr auto auto;
        gap: 8px;
        align-items: center;
        padding: 8px 10px;
        border-radius: 12px;
        background: rgba(2,6,23,.34);
        border: 1px solid rgba(255,255,255,.08);
      }

      .picked-title {
        font-weight: 760;
      }

      .picked-meta {
        color: var(--muted2);
        font-size: .86rem;
      }

      .picked-sum {
        color: var(--accent);
        font-weight: 850;
        white-space: nowrap;
      }

      .picked-remove {
        width: 30px;
        height: 30px;
        border-radius: 10px;
        background: rgba(255,255,255,.08);
        color: var(--muted);
        font-weight: 900;
      }

      .dropdown-empty {
        color: var(--muted2);
        font-size: .92rem;
      }

      body.dropdown-mode .mini-selected {
        display: none !important;
      }

      @media (max-width: 760px) {
        .dropdown-work-grid {
          grid-template-columns: 1fr;
        }

        .picked-row {
          grid-template-columns: 1fr auto;
        }

        .picked-sum {
          grid-column: 1 / 2;
        }

        .picked-remove {
          grid-column: 2 / 3;
          grid-row: 1 / 3;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function createSelector() {
    const servicesCard = document.querySelector('.services');
    const servicesList = byId('servicesList');
    if (!servicesCard || !servicesList || byId('dropdownWorkCard')) return;

    document.body.classList.add('dropdown-mode');

    const card = document.createElement('div');
    card.id = 'dropdownWorkCard';
    card.className = 'dropdown-work-card';
    card.innerHTML = `
      <div class="dropdown-work-grid">
        <label>Категория
          <select id="dropdownCategory"></select>
        </label>
        <label>Работа
          <select id="dropdownService"></select>
        </label>
        <label>Кол-во
          <input id="dropdownQty" type="number" min="1" value="1" inputmode="numeric">
        </label>
      </div>
      <button class="main-btn dropdown-add" id="dropdownAdd" type="button">Добавить работу</button>
      <div class="dropdown-picked" id="dropdownPicked"></div>
    `;
    servicesList.insertAdjacentElement('beforebegin', card);

    fillCategories();
    fillServices();
    bindSelector();
    updatePicked();
  }

  function fillCategories() {
    const select = byId('dropdownCategory');
    const options = [
      `<option value="all">Все работы</option>`,
      ...getGroups().map((group) => `<option value="${group.id}">${group.title.replace('Электрика · ', '')}</option>`)
    ];
    select.innerHTML = options.join('');
  }

  function fillServices() {
    const category = byId('dropdownCategory')?.value || 'all';
    const select = byId('dropdownService');
    const items = getServices().filter((service) => category === 'all' || service.category === category);
    select.innerHTML = items.map((service) => `<option value="${service.id}">${service.title} — ${format(service.price)}</option>`).join('');
  }

  function setQty(serviceId, qty) {
    const input = document.querySelector(`[data-qty='${serviceId}']`);
    if (!input) return;
    input.value = Math.max(0, money(qty));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    runCalculate();
    updatePicked();
  }

  function addSelectedService() {
    const serviceId = byId('dropdownService')?.value;
    const qtyToAdd = Math.max(1, money(byId('dropdownQty')?.value || 1));
    const input = document.querySelector(`[data-qty='${serviceId}']`);
    const current = money(input?.value || 0);
    setQty(serviceId, current + qtyToAdd);
    byId('dropdownQty').value = 1;
  }

  function updatePicked() {
    const box = byId('dropdownPicked');
    if (!box) return;

    const selectedWorks = getSelected();
    if (!selectedWorks.length) {
      box.classList.remove('open');
      box.innerHTML = `<div class="dropdown-empty">Выбранных работ пока нет</div>`;
      return;
    }

    box.classList.add('open');
    box.innerHTML = selectedWorks.map((item) => `
      <div class="picked-row">
        <div>
          <div class="picked-title">${item.title}</div>
          <div class="picked-meta">${item.qty} ${item.unit} × ${format(item.price)}</div>
        </div>
        <div class="picked-sum">${format(item.subtotal)}</div>
        <button class="picked-remove" type="button" data-remove-picked="${item.id}" aria-label="Убрать ${item.title}">×</button>
      </div>
    `).join('');
  }

  function bindSelector() {
    byId('dropdownCategory')?.addEventListener('change', fillServices);
    byId('dropdownAdd')?.addEventListener('click', addSelectedService);

    byId('dropdownQty')?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') addSelectedService();
    });

    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-remove-picked]');
      if (!button) return;
      setQty(button.dataset.removePicked, 0);
    });

    document.addEventListener('input', (event) => {
      if (event.target.matches('[data-qty], #visitPrice, #minimumPrice, #materialsExtra, #complexity, #urgency, #discount')) {
        setTimeout(updatePicked, 0);
      }
    });

    document.addEventListener('click', (event) => {
      if (event.target.matches('[data-plus], [data-minus], #resetBtn')) {
        setTimeout(updatePicked, 0);
      }
    });
  }

  function init() {
    addStyles();
    setTimeout(createSelector, 0);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
