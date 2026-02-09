// Система збору даних про відвідувачів
// Збирає: IP, геолокація, пристрій, браузер, час візиту, кліки тощо

const ANALYTICS_KEY = 'visitor_analytics';
const WEBHOOK_URL = 'https://webhook.site/fb431e14-5d44-4851-93cd-bb39514455e9'; // Заповни своїм webhook URL (наприклад, з webhook.site)

// Збір даних про браузер/пристрій
function collectBrowserData() { 
  const ua = navigator.userAgent;
  const screen = window.screen;
  
  // Визначення типу пристрою
  let deviceType = 'Desktop';
  if (/Mobile|Android|iPhone|iPad/.test(ua)) {
    deviceType = /iPad/.test(ua) ? 'Tablet' : 'Mobile';
  }
  
  // Визначення ОС
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  
  // Визначення браузера
  let browser = 'Unknown';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Opera')) browser = 'Opera';
  
  return {
    userAgent: ua,
    deviceType,
    os,
    browser,
    screenWidth: screen.width,
    screenHeight: screen.height,
    colorDepth: screen.colorDepth,
    pixelRatio: window.devicePixelRatio || 1,
    language: navigator.language,
    languages: navigator.languages || [navigator.language],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    cookieEnabled: navigator.cookieEnabled,
    online: navigator.onLine,
    referrer: document.referrer || 'Direct',
    url: window.location.href,
    timestamp: new Date().toISOString(),
    localTime: new Date().toLocaleString('uk-UA'),
  };
}

// Отримання IP та геолокації через API
async function getIPAndGeo() {
  try {
    // Спробуємо кілька безкоштовних API
    const apis = [
      'https://api.ipify.org?format=json',
      'https://api64.ipify.org?format=json',
      'https://ipapi.co/json/',
    ];
    
    for (const apiUrl of apis) {
      try {
        const response = await fetch(apiUrl, { 
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) continue;
        
        const data = await response.json();
        
        // ipapi.co повертає повну інформацію
        if (apiUrl.includes('ipapi.co') && data.ip) {
          return {
            ip: data.ip,
            country: data.country_name || 'Unknown',
            countryCode: data.country_code || '',
            city: data.city || 'Unknown',
            region: data.region || '',
            latitude: data.latitude || null,
            longitude: data.longitude || null,
            isp: data.org || 'Unknown',
            timezone: data.timezone || null,
          };
        }
        
        // ipify тільки IP
        if (data.ip) {
          // Спробуємо отримати геолокацію окремо
          try {
            const geoResponse = await fetch(`https://ipapi.co/${data.ip}/json/`);
            if (geoResponse.ok) {
              const geo = await geoResponse.json();
              return {
                ip: data.ip,
                country: geo.country_name || 'Unknown',
                countryCode: geo.country_code || '',
                city: geo.city || 'Unknown',
                region: geo.region || '',
                latitude: geo.latitude || null,
                longitude: geo.longitude || null,
                isp: geo.org || 'Unknown',
                timezone: geo.timezone || null,
              };
            }
          } catch (e) {
            // Якщо гео не вдалося, повертаємо тільки IP
          }
          
          return {
            ip: data.ip,
            country: 'Unknown',
            countryCode: '',
            city: 'Unknown',
            region: '',
            latitude: null,
            longitude: null,
            isp: 'Unknown',
            timezone: null,
          };
        }
      } catch (e) {
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.warn('Не вдалося отримати IP/геолокацію:', error);
    return null;
  }
}

// Збір додаткових даних (кліки, час на сайті)
let visitStartTime = Date.now();
let clickCount = 0;
let scrollDepth = 0;
let maxScrollDepth = 0;

function trackInteractions() {
  // Відстеження кліків
  document.addEventListener('click', (e) => {
    clickCount++;
    const target = e.target;
    const data = {
      type: 'click',
      target: target.tagName.toLowerCase(),
      id: target.id || '',
      className: target.className || '',
      text: target.textContent?.substring(0, 50) || '',
      timestamp: new Date().toISOString(),
    };
    saveInteraction(data);
  }, true);
  
  // Відстеження прокрутки
  let scrollTimer;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      scrollDepth = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
      maxScrollDepth = Math.max(maxScrollDepth, scrollDepth);
    }, 100);
  });
  
  // Відстеження часу на сайті
  setInterval(() => {
    const timeOnSite = Math.floor((Date.now() - visitStartTime) / 1000);
    // Зберігаємо кожні 30 секунд
    if (timeOnSite % 30 === 0) {
      localStorage.setItem('timeOnSite', timeOnSite.toString());
    }
  }, 1000);
  
  // Відстеження виходу зі сторінки
  window.addEventListener('beforeunload', () => {
    const finalData = {
      type: 'page_exit',
      timeOnSite: Math.floor((Date.now() - visitStartTime) / 1000),
      maxScrollDepth,
      clickCount,
      timestamp: new Date().toISOString(),
    };
    saveInteraction(finalData);
  });
}

// Збереження взаємодій
function saveInteraction(data) {
  try {
    const existing = JSON.parse(localStorage.getItem('interactions') || '[]');
    existing.push(data);
    // Зберігаємо останні 100 подій
    if (existing.length > 100) {
      existing.shift();
    }
    localStorage.setItem('interactions', JSON.stringify(existing));
  } catch (e) {
    console.warn('Не вдалося зберегти взаємодію:', e);
  }
}

// Збереження даних відвідувача
async function saveVisitorData() {
  const browserData = collectBrowserData();
  const geoData = await getIPAndGeo();
  
  const visitorData = {
    ...browserData,
    ...(geoData || {}),
    visitId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sessionStart: visitStartTime,
  };
  
  // Зберігаємо в localStorage
  try {
    const existing = JSON.parse(localStorage.getItem(ANALYTICS_KEY) || '[]');
    // Перевіряємо, чи це новий відвідувач (по IP або visitId)
    const isNewVisitor = !existing.some(v => 
      v.ip === visitorData.ip || 
      (Date.now() - new Date(v.timestamp).getTime()) < 30000 // менше 30 сек = той самий відвідувач
    );
    
    if (isNewVisitor) {
      existing.push(visitorData);
      // Зберігаємо останні 500 відвідувачів
      if (existing.length > 500) {
        existing.shift();
      }
      localStorage.setItem(ANALYTICS_KEY, JSON.stringify(existing));
    }
    
    // Відправляємо на webhook, якщо вказано
    if (WEBHOOK_URL) {
      try {
        await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(visitorData),
        });
      } catch (e) {
        console.warn('Не вдалося відправити дані на webhook:', e);
      }
    }
    
    return visitorData;
  } catch (e) {
    console.warn('Не вдалося зберегти дані відвідувача:', e);
    return visitorData;
  }
}

// Ініціалізація
async function initAnalytics() {
  // Чекаємо трохи, щоб не блокувати завантаження сторінки
  setTimeout(async () => {
    await saveVisitorData();
    trackInteractions();
  }, 1000);
}

// Експорт для використання в інших файлах
window.analytics = {
  saveVisitorData,
  getVisitorData: () => JSON.parse(localStorage.getItem(ANALYTICS_KEY) || '[]'),
  getInteractions: () => JSON.parse(localStorage.getItem('interactions') || '[]'),
  clearData: () => {
    localStorage.removeItem(ANALYTICS_KEY);
    localStorage.removeItem('interactions');
    localStorage.removeItem('timeOnSite');
  },
};

// Автоматичний запуск
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAnalytics);
} else {
  initAnalytics();
}
