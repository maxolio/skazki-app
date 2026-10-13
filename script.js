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
      const endpoint = 'https://api.skazkikids.ru/api/track';
      const payload = JSON.stringify({
        event: eventName,
        source: utmSource,
        details: extraDetails || (window.location.search || 'direct')
      });

      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(endpoint, blob);
      } else {
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true
        }).catch(() => {});
      }
    } catch (e) {
      // Тихий режим — аналитика не должна мешать пользователю
    }
  }

  // Фиксация визита на сайт (один раз за сессию)
  if (!sessionStorage.getItem('skazki_visit_tracked')) {
    trackEvent('visit', window.location.search || 'direct');
    sessionStorage.setItem('skazki_visit_tracked', '1');
  }

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

      // Фиксация события копирования промокода
      trackEvent('copy_promo_kotik', 'Промокод KOTIK скопирован');

      // Визуальный отклик
      copyBtn.classList.add('copied');
      copyText.textContent = 'Скопировано! ✅';

      // Возврат через 2.5 секунды
      setTimeout(() => {
        copyBtn.classList.remove('copied');
        copyText.textContent = 'Скопировать';
      }, 2500);

    } catch (err) {
      console.error('Ошибка копирования:', err);
      copyText.textContent = 'Код: KOTIK';
    }
  }

  // Клик по кнопке «Скопировать»
  if (copyBtn) {
    copyBtn.addEventListener('click', copyPromoCode);
  }

  // Клик по самой рамочке с кодом тоже копирует
  if (couponBox) {
    couponBox.style.cursor = 'pointer';
    couponBox.addEventListener('click', copyPromoCode);
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

  // Анализ устройства (Huawei, Android и т.д.) для удобства пользователя
  const userAgent = navigator.userAgent.toLowerCase();
  const isHuawei = userAgent.includes('huawei') || userAgent.includes('honor');

  if (isHuawei) {
    const huaweiCard = document.querySelector('.store-huawei');
    if (huaweiCard) {
      huaweiCard.style.order = '-1'; // Поднимаем AppGallery наверх для владельцев Huawei
    }
  }
});
