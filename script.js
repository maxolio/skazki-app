// ==========================================================================
// Логика промо-лендинга «Сказки» (Kids Story Quest)
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  const couponCodeEl = document.getElementById('couponCode');
  const copyBtn = document.getElementById('copyBtn');
  const copyText = document.getElementById('copyText');
  const couponBox = document.getElementById('couponBox');

  const CODE_TO_COPY = 'KOTIK';

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
