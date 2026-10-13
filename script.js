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
