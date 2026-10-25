// ==========================================================================
// Логика промо-лендинга «Сказки» (Kids Story Quest)
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  const couponCodeEl = document.getElementById('couponCode');
  const copyBtn = document.getElementById('copyBtn');
  const copyText = document.getElementById('copyText');
  const couponBox = document.getElementById('couponBox');

  const CODE_TO_COPY = 'KOTIK';

  // ==========================================================================
  // Фоновая аналитика кликов и переходов (skazkikids.ru -> api.skazkikids.ru)
  // ==========================================================================
  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get('utm_source') || urlParams.get('source') || 'direct';

  function trackEvent(eventName, extraDetails = '') {
    try {
      const q = new URLSearchParams({
        event: eventName,
        source: utmSource,
        details: extraDetails || (window.location.search || 'direct'),
        _t: Date.now()
      });
      // 100% надежный метод отслеживания без CORS-блокировок на всех телефонах
      const img = new Image();
      img.src = 'https://api.skazkikids.ru/api/track?' + q.toString();
    } catch (e) {
      // Тихий режим — аналитика не должна мешать пользователю
    }
  }

  // Фиксация визита на сайт (один раз за сессию)
  if (!sessionStorage.getItem('skazki_visit_tracked')) {
    trackEvent('visit', window.location.search || 'direct');
    sessionStorage.setItem('skazki_visit_tracked', '1');
  }

  const promoHeaderBar = document.getElementById('promoHeaderBar');
  const promoChip = document.getElementById('promoChip');
  const promoCodeText = document.getElementById('promoCodeText');
  const promoCopyIcon = document.getElementById('promoCopyIcon');

  // Функция копирования в буфер обмена
  async function copyPromoCode() {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(CODE_TO_COPY);
      } else {
        // Fallback для старых мобильных браузеров
        const tempInput = document.createElement('input');
        tempInput.value = CODE_TO_COPY;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }

      // Фиксация события копирования промокода в аналитику
      trackEvent('copy_promo_kotik', 'Промокод KOTIK скопирован');

      // Визуальный отклик на плашке над сторами (текст KOTIK остаётся, меняется иконка на зелёную галочку)
      if (promoChip) {
        promoChip.classList.add('copied');
        if (promoCopyIcon) promoCopyIcon.textContent = '✅';
      }

      if (copyBtn) {
        copyBtn.classList.add('copied');
        if (copyText) copyText.textContent = 'Скопировано! ✅';
      }

      // Возврат через 2 секунды
      setTimeout(() => {
        if (promoChip) {
          promoChip.classList.remove('copied');
          if (promoCopyIcon) promoCopyIcon.textContent = '📋';
        }
        if (copyBtn) {
          copyBtn.classList.remove('copied');
          if (copyText) copyText.textContent = 'Скопировать';
        }
      }, 2000);

    } catch (err) {
      console.error('Ошибка копирования:', err);
    }
  }

  // Клик по промокод-плашке над магазинами
  if (promoHeaderBar) {
    promoHeaderBar.addEventListener('click', copyPromoCode);
  }

  // Клики по кнопкам магазинов приложений
  const googleBtn = document.querySelector('.store-google');
  if (googleBtn) {
    googleBtn.addEventListener('click', () => {
      trackEvent('click_google_play', 'Переход в Google Play');
    });
  }

  const rustoreBtn = document.querySelector('.store-rustore');
  if (rustoreBtn) {
    rustoreBtn.addEventListener('click', () => {
      trackEvent('click_rustore', 'Переход в RuStore');
    });
  }

  const huaweiBtn = document.querySelector('.store-huawei');
  if (huaweiBtn) {
    huaweiBtn.addEventListener('click', () => {
      trackEvent('click_appgallery', 'Переход в AppGallery');
    });
  }

  // Анализ устройства (Huawei, iPhone/iPad, Android и т.д.) для удобства пользователя
  const userAgent = navigator.userAgent.toLowerCase();
  const isHuawei = userAgent.includes('huawei') || userAgent.includes('honor');
  const isIOS = /iphone|ipad|ipod/.test(userAgent);

  if (isHuawei) {
    const huaweiCard = document.querySelector('.store-huawei');
    if (huaweiCard) {
      huaweiCard.style.order = '-1'; // Поднимаем AppGallery наверх для владельцев Huawei
    }
  }

  if (isIOS) {
    const buyCodeCard = document.getElementById('btnOpenBuyCodeModal');
    if (buyCodeCard) {
      buyCodeCard.style.order = '-2'; // Поднимаем покупку кода доступа на 1 место для iPhone/iPad
    }
  }

  // ==========================================================================
  // Модальное окно покупки 6-значного кода доступа через Робокассу / СБП
  // ==========================================================================
  const btnOpenBuyCodeModal = document.getElementById('btnOpenBuyCodeModal');
  const btnCloseBuyCodeModal = document.getElementById('btnCloseBuyCodeModal');
  const buyCodeModal = document.getElementById('buyCodeModal');
  const buyPartSelector = document.getElementById('buyPartSelector');
  const buyEmailInput = document.getElementById('buyEmailInput');
  const buyPromoInput = document.getElementById('buyPromoInput');
  const btnApplyWebPromo = document.getElementById('btnApplyWebPromo');
  const buyPromoStatus = document.getElementById('buyPromoStatus');
  const buyErrorMsg = document.getElementById('buyErrorMsg');
  const btnSubmitWebPay = document.getElementById('btnSubmitWebPay');
  const buySubmitPrice = document.getElementById('buySubmitPrice');

  let selectedPartId = 'part-1';
  let appliedPromoCode = '';

  function getOrCreateWebUserId() {
    let uid = localStorage.getItem('skazki_web_user_id');
    if (!uid) {
      uid = 'usr_web_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('skazki_web_user_id', uid);
    }
    return uid;
  }

  // Подгружаем сохраненный email, если есть
  const savedEmail = localStorage.getItem('skazki_web_email');
  if (savedEmail && buyEmailInput) {
    buyEmailInput.value = savedEmail;
  }

  function evaluatePromoAndPrice(showFeedback = false) {
    if (!buyPromoInput || !buySubmitPrice) return;
    const rawPromo = buyPromoInput.value.trim().toLowerCase();
    let price = 399;
    appliedPromoCode = '';

    if (rawPromo === 'kotik') {
      price = 299;
      appliedPromoCode = 'kotik';
      if (buyPromoStatus) {
        buyPromoStatus.textContent = '✅ Промокод KOTIK применён: скидка 100 ₽!';
        buyPromoStatus.className = 'buy-promo-status ok';
      }
    } else if (rawPromo === 'test1234') {
      price = 11;
      appliedPromoCode = 'test1234';
      if (buyPromoStatus) {
        buyPromoStatus.textContent = '✅ Тестовый промокод применён (11 ₽)';
        buyPromoStatus.className = 'buy-promo-status ok';
      }
    } else if (rawPromo.length > 0) {
      if (showFeedback && buyPromoStatus) {
        buyPromoStatus.textContent = 'Неверный промокод (попробуйте KOTIK)';
        buyPromoStatus.className = 'buy-promo-status err';
      } else if (buyPromoStatus) {
        buyPromoStatus.textContent = '';
        buyPromoStatus.className = 'buy-promo-status';
      }
    } else {
      if (buyPromoStatus) {
        buyPromoStatus.textContent = '';
        buyPromoStatus.className = 'buy-promo-status';
      }
    }

    buySubmitPrice.textContent = price + ' ₽';
  }

  function openBuyModal() {
    if (!buyCodeModal) return;
    buyCodeModal.classList.add('open');
    buyCodeModal.setAttribute('aria-hidden', 'false');
    if (buyErrorMsg) buyErrorMsg.textContent = '';
    evaluatePromoAndPrice(false);
    trackEvent('open_buy_code_modal', selectedPartId);
  }

  function closeBuyModal() {
    if (!buyCodeModal) return;
    buyCodeModal.classList.remove('open');
    buyCodeModal.setAttribute('aria-hidden', 'true');
  }

  if (btnOpenBuyCodeModal) {
    btnOpenBuyCodeModal.addEventListener('click', openBuyModal);
  }

  if (btnCloseBuyCodeModal) {
    btnCloseBuyCodeModal.addEventListener('click', closeBuyModal);
  }

  if (buyCodeModal) {
    buyCodeModal.addEventListener('click', (e) => {
      if (e.target === buyCodeModal) closeBuyModal();
    });
  }

  // При клике на плашку промокода KOTIK на главном экране также подставляем его в окно покупки
  if (promoHeaderBar && buyPromoInput) {
    promoHeaderBar.addEventListener('click', () => {
      buyPromoInput.value = 'KOTIK';
      evaluatePromoAndPrice(true);
    });
  }

  // Переключение Сборника №1 / Сборника №2
  if (buyPartSelector) {
    const partBtns = buyPartSelector.querySelectorAll('.buy-part-btn');
    partBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        partBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        selectedPartId = btn.getAttribute('data-part') || 'part-1';
      });
    });
  }

  if (btnApplyWebPromo) {
    btnApplyWebPromo.addEventListener('click', () => {
      evaluatePromoAndPrice(true);
    });
  }

  if (buyPromoInput) {
    buyPromoInput.addEventListener('input', () => {
      evaluatePromoAndPrice(false);
    });
  }

  if (btnSubmitWebPay) {
    btnSubmitWebPay.addEventListener('click', async () => {
      if (buyErrorMsg) buyErrorMsg.textContent = '';
      const email = buyEmailInput ? buyEmailInput.value.trim().toLowerCase() : '';
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (buyErrorMsg) buyErrorMsg.textContent = 'Пожалуйста, укажите корректный E-mail для чека и кода';
        if (buyEmailInput) buyEmailInput.focus();
        return;
      }

      evaluatePromoAndPrice(false);
      localStorage.setItem('skazki_web_email', email);
      const userId = getOrCreateWebUserId();

      btnSubmitWebPay.disabled = true;
      const originalHtml = btnSubmitWebPay.innerHTML;
      btnSubmitWebPay.textContent = 'Переход к СБП...';

      try {
        trackEvent('web_checkout_start', `${selectedPartId}:${appliedPromoCode || 'full'}`);
        const q = new URLSearchParams({
          action: 'get-payment-url',
          userId,
          partId: selectedPartId,
          email,
          promoCode: appliedPromoCode,
          source: 'web'
        });

        const resp = await fetch('https://api.skazkikids.ru/?' + q.toString());
        const data = await resp.json();

        if (data && data.paymentUrl) {
          window.location.href = data.paymentUrl;
        } else {
          throw new Error('Не удалось получить ссылку на оплату');
        }
      } catch (err) {
        if (buyErrorMsg) {
          buyErrorMsg.textContent = 'Ошибка соединения с сервером оплаты. Попробуйте ещё раз.';
        }
        btnSubmitWebPay.disabled = false;
        btnSubmitWebPay.innerHTML = originalHtml;
      }
    });
  }

  // Авто-открытие модалки, если перешли по ссылке skazkikids.ru/?buy=1
  if (urlParams.get('buy') === '1' || window.location.hash === '#buy') {
    openBuyModal();
  }
});
