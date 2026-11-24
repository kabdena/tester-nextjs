'use client';

import { useEffect } from 'react';
import { sendVisitParams } from '@/utils/metrika';
import { getInAppBrowser, isStandalone } from '@/utils/env';

// Один раз за загрузку страницы сообщает Метрике, открыт ли сайт во встроенном
// браузере (Telegram, Instagram) и с экрана «Домой». Без идентификаторов.
const KNOWN_REFS = ['share', 'result_tg'];

const VisitParams = () => {
  useEffect(() => {
    // ref проставляют ссылки, которые генерирует сам тестер (шаринг, результат).
    const ref = new URLSearchParams(window.location.search).get('ref');
    sendVisitParams({
      inapp: getInAppBrowser(),
      standalone: isStandalone(),
      ...(ref && KNOWN_REFS.includes(ref) ? { ref } : {}),
    });
  }, []);
  return null;
};

export default VisitParams;
