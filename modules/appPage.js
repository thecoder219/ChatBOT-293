'use strict';

import {
  OPENROUTER_URL,
  OPENROUTER_KEY,
  SITE_URL,
  SITE_TITLE,
  WEATHER_URL,
  WEATHER_REFRESH_INTERVAL,
  STORAGE_KEY,
  NOTICE_KEY,
  USER_NAME_KEY,
  ERROR_MESSAGE,
  APP_GREETING_VARIANTS,
  APP_NAME_VARIANTS,
  APP_CREATOR_VARIANTS,
  NON_MEDICAL_RESPONSE,
  WEATHER_CODES
} from './constants.js';
import { pickVariant, sanitizeStreamText } from './helpers.js';

export function initAppPage() {
  const chatArea = document.getElementById('chatArea');
  const userInput = document.getElementById('userInput');
  const noticeBanner = document.getElementById('noticeBanner');
  const noticeCloseBtn = document.getElementById('noticeCloseBtn');
  const weatherElements = {
    card: document.getElementById('weatherCard'),
    temp: document.getElementById('weatherTemp'),
    desc: document.getElementById('weatherDesc'),
    humidity: document.getElementById('weatherHumidity'),
    wind: document.getElementById('weatherWind'),
    updated: document.getElementById('weatherUpdated')
  };

  let noticeAutoHideHandle = null;
  let weatherRefreshHandle = null;
  let isProcessing = false;
  let isRequesting = false;

  const setText = (element, value) => {
    if (element) {
      element.textContent = value;
    }
  };

  const renderToHtml = markdown => {
    try {
      const parsed = window.marked ? window.marked.parse(markdown || '') : markdown || '';
      const wrapper = document.createElement('div');
      wrapper.innerHTML = parsed;
      if (window.renderMathInElement) {
        window.renderMathInElement(wrapper, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
          ]
        });
      }
      return wrapper.innerHTML;
    } catch (error) {
      return markdown || '';
    }
  };

  const handleNotice = () => {
    if (!noticeBanner) {
      return;
    }
    if (noticeAutoHideHandle) {
      clearTimeout(noticeAutoHideHandle);
      noticeAutoHideHandle = null;
    }
    if (localStorage.getItem(NOTICE_KEY)) {
      noticeBanner.classList.add('hidden');
      return;
    }
    noticeBanner.classList.remove('hidden');
    noticeAutoHideHandle = setTimeout(() => {
      noticeBanner.classList.add('hidden');
      localStorage.setItem(NOTICE_KEY, 'true');
      noticeAutoHideHandle = null;
    }, 10000);
  };

  const setWeatherLoading = loading => {
    if (weatherElements.card) {
      weatherElements.card.classList.toggle('loading', Boolean(loading));
    }
  };

  const formatWeatherUpdated = time => {
    if (!time) {
      return 'Updated just now';
    }
    const parsed = new Date(time);
    if (Number.isNaN(parsed.getTime())) {
      return 'Updated just now';
    }
    return `Updated at ${parsed.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`;
  };

  const describeWeather = code => WEATHER_CODES[code] || 'Current conditions';

  const showWeatherError = message => {
    if (!weatherElements.card) {
      return;
    }
    weatherElements.card.classList.add('error');
    weatherElements.card.title = message || 'Weather data unavailable';
    setText(weatherElements.temp, '--°C');
    setText(weatherElements.desc, 'Weather unavailable');
    setText(weatherElements.updated, 'Retrying shortly');
    setText(weatherElements.humidity, '--% humidity');
    setText(weatherElements.wind, 'Check connection');
  };

  const saveMessages = () => {
    const messages = [];
    document.querySelectorAll('.message').forEach(message => {
      const content = message.querySelector('.message-content');
      if (content) {
        messages.push({ type: message.classList.contains('user') ? 'user' : 'bot', content: content.innerHTML });
      }
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  };

  const addMessage = (html, sender, save = true) => {
    const wrapper = document.createElement('div');
    wrapper.className = `message ${sender}`;
    const src = sender === 'bot' ? 'logo.png' : 'user-avatar.png';
    const alt = sender === 'bot' ? 'DemoMed AI' : 'User';
    const overlay = sender === 'bot' ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a3 3 0 013 3v1h2a2 2 0 012 2v3a6 6 0 01-6 6h-2a6 6 0 01-6-6V8a2 2 0 012-2h2V5a3 3 0 013-3z" stroke="currentColor" stroke-width="1.5" opacity="0.6"/></svg>' : '';
    wrapper.innerHTML = `<div class="message-avatar">${overlay}<img src="${src}" alt="${alt}" onerror="this.style.display='none'"></div><div class="message-content">${html}</div>`;
    chatArea.appendChild(wrapper);
    chatArea.scrollTop = chatArea.scrollHeight;
    if (save) {
      saveMessages();
    }
    return wrapper;
  };

  const showTyping = () => {
    const typing = document.createElement('div');
    typing.className = 'message bot';
    typing.id = 'typing';
    typing.innerHTML = '<div class="message-avatar"><img src="logo.png" alt="DemoMed AI" onerror="this.style.display=\'none\'"></div><div class="message-content"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>';
    chatArea.appendChild(typing);
    chatArea.scrollTop = chatArea.scrollHeight;
  };

  const removeTyping = () => {
    const typing = document.getElementById('typing');
    if (typing) {
      typing.remove();
    }
  };

  const showTempLabel = (id, text) => {
    removeTempLabel(id);
    const label = document.createElement('div');
    label.className = 'temp-label';
    label.dataset.id = id;
    label.textContent = text;
    label.style.margin = '6px 28px';
    label.style.color = '#64748b';
    label.style.fontSize = '12px';
    label.style.fontWeight = '700';
    chatArea.appendChild(label);
    chatArea.scrollTop = chatArea.scrollHeight;
  };

  const removeTempLabel = id => {
    document.querySelectorAll('.temp-label').forEach(label => {
      if (label.dataset.id === id) {
        label.remove();
      }
    });
  };

  const isBigOrMultiQuestion = text => {
    if (!text) {
      return false;
    }
    const questionMarks = (text.match(/\?/g) || []).length;
    const sentences = text.split(/[.!?]\s+/).filter(Boolean).length;
    return text.length > 220 || questionMarks >= 2 || sentences >= 3;
  };

  const interceptResponse = text => {
    const lower = (text || '').toLowerCase();
    const greetingPattern = /(hi|hello|hey|hola|namaste|yo)\b/;
    const namePattern = /(what('| i)?s your name|who are you|ur name|your name|name\??)/;
    const creatorPattern = /(who (made|built|created) (you|this)|creator|developer|owner)/;
    if (namePattern.test(lower)) {
      return pickVariant(APP_NAME_VARIANTS);
    }
    if (greetingPattern.test(lower)) {
      return pickVariant(APP_GREETING_VARIANTS);
    }
    if (creatorPattern.test(lower)) {
      return pickVariant(APP_CREATOR_VARIANTS);
    }
    return null;
  };

  const isOutOfScope = text => {
    const lower = (text || '').toLowerCase();
    const nonMedicalHints = ['code', 'coding', 'javascript', 'react', 'python', 'bug', 'debug', 'compile', 'algorithm', 'leetcode', 'program'];
    const medicalHints = ['health', 'medicine', 'medical', 'symptom', 'disease', 'doctor', 'drug', 'diagnos', 'treatment', 'history of medicine', 'anatomy', 'physiology', 'pathology'];
    const hasNonMedical = nonMedicalHints.some(hint => lower.includes(hint));
    const hasMedical = medicalHints.some(hint => lower.includes(hint));
    return hasNonMedical && !hasMedical;
  };

  const handleWeather = async () => {
    clearTimeout(weatherRefreshHandle);
    setWeatherLoading(true);
    try {
      const response = await fetch(WEATHER_URL);
      if (!response.ok) {
        throw new Error(`Weather API error (${response.status})`);
      }
      const data = await response.json();
      const current = data && data.current;
      if (!current) {
        throw new Error('No weather data returned');
      }
      const temperature = current.temperature_2m;
      const humidity = current.relative_humidity_2m;
      const windSpeed = current.wind_speed_10m;
      const condition = describeWeather(current.weather_code);
      if (weatherElements.card) {
        weatherElements.card.classList.remove('error');
        weatherElements.card.title = '';
      }
      setText(weatherElements.temp, Number.isFinite(temperature) ? `${Math.round(temperature)}°C` : '--°C');
      setText(weatherElements.desc, condition);
      setText(weatherElements.updated, formatWeatherUpdated(current.time));
      setText(weatherElements.humidity, Number.isFinite(humidity) ? `${Math.round(humidity)}% humidity` : '--% humidity');
      setText(weatherElements.wind, Number.isFinite(windSpeed) ? `${Math.round(windSpeed)} km/h wind` : '-- km/h wind');
    } catch (error) {
      showWeatherError(error.message || 'Unable to load weather');
    } finally {
      setWeatherLoading(false);
      weatherRefreshHandle = setTimeout(handleWeather, WEATHER_REFRESH_INTERVAL);
    }
  };

  const showWelcome = () => {
    chatArea.innerHTML = '<div class="welcome-message"><div class="welcome-icon-container"><img src="logo.png" alt="DemoMed AI"></div><div class="welcome-title">Welcome to DemoMed AI</div><div class="welcome-text">DemoMed AI is a medical assistant prototype created by Class 10 students from LKCRMS.</div><div class="quick-actions"><button class="quick-action-btn" onclick="insertQuery(\'Why I am feeling sick?\')">Why I\'m feeling sick?</button><button class="quick-action-btn" onclick="insertQuery(\'Benefits of eating apple\')">Benefits of eating apple</button><button class="quick-action-btn" onclick="insertQuery(\'How to prevent dandruff?\')">How to prevent dandruff?</button></div></div>';
  };

  const loadMessages = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      showWelcome();
      return;
    }
    let messages = null;
    try {
      messages = JSON.parse(stored);
    } catch (error) {
      console.warn('Clearing corrupt conversation history', error);
      localStorage.removeItem(STORAGE_KEY);
      showWelcome();
      return;
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      showWelcome();
      return;
    }
    messages.forEach(message => {
      if (!message || (message.type !== 'user' && message.type !== 'bot')) {
        return;
      }
      const safeContent = typeof message.content === 'string' ? message.content : '';
      addMessage(safeContent, message.type, false);
    });
  };

  const showTempHints = message => {
    if (isBigOrMultiQuestion(message)) {
      showTempLabel('big-hint', "You've asked multiple or big questions at once, so the responses might take some time to load.");
    }
  };

  const streamMessageFromAPI = async (userMessage, messageElement) => {
    const contentElement = messageElement && messageElement.querySelector('.message-content');
    if (!contentElement) {
      return;
    }
    if (isRequesting) {
      return;
    }
    isRequesting = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENROUTER_KEY}`,
          'HTTP-Referer': SITE_URL,
          'X-Title': SITE_TITLE,
          'Content-Type': 'application/json',
          Accept: 'text/event-stream'
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat-v3.1:free',
          stream: true,
          messages: [{ role: 'user', content: userMessage }]
        }),
        signal: controller.signal,
        keepalive: true
      });
      clearTimeout(timeout);
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || response.statusText);
      }
      removeTyping();
      let accumulated = '';
      let stallTimer = setTimeout(() => showTempLabel('stall', 'GENERATING......'), 2500);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let clearedBigHint = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').map(line => line.trim()).filter(Boolean);
        for (const line of lines) {
          if (!line.startsWith('data:')) {
            continue;
          }
          const data = line.replace(/^data:\s*/, '');
          if (data === '[DONE]') {
            continue;
          }
          try {
            const json = JSON.parse(data);
            const delta = json && json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content;
            if (delta) {
              accumulated += sanitizeStreamText(delta);
              contentElement.innerHTML = renderToHtml(accumulated);
              chatArea.scrollTop = chatArea.scrollHeight;
              removeTempLabel('stall');
              clearTimeout(stallTimer);
              stallTimer = setTimeout(() => showTempLabel('stall', 'GENERATING......'), 3000);
              if (!clearedBigHint) {
                removeTempLabel('big-hint');
                clearedBigHint = true;
              }
            }
          } catch (error) {
            continue;
          }
        }
      }
      removeTempLabel('stall');
      removeTempLabel('big-hint');
      saveMessages();
    } catch (error) {
      removeTempLabel('stall');
      removeTempLabel('big-hint');
      throw error;
    } finally {
      clearTimeout(timeout);
      setTimeout(() => {
        isRequesting = false;
      }, 1500);
    }
  };

  const sendMessage = async () => {
    if (isProcessing) {
      return;
    }
    const message = (userInput.value || '').trim();
    if (!message) {
      return;
    }
    const intercepted = interceptResponse(message);
    if (intercepted) {
      addMessage(renderToHtml(intercepted), 'bot');
      userInput.value = '';
      return;
    }
    if (isOutOfScope(message)) {
      addMessage(NON_MEDICAL_RESPONSE, 'bot');
      userInput.value = '';
      return;
    }
    isProcessing = true;
    userInput.disabled = true;
    const sendButton = document.getElementById('sendBtn');
    if (sendButton) {
      sendButton.disabled = true;
    }
    const welcome = document.querySelector('.welcome-message');
    if (welcome) {
      welcome.remove();
    }
    addMessage(message, 'user');
    userInput.value = '';
    userInput.style.height = 'auto';
    showTyping();
    showTempHints(message);
    try {
      const placeholder = addMessage('', 'bot');
      await streamMessageFromAPI(message, placeholder);
    } catch (error) {
      removeTyping();
      addMessage(ERROR_MESSAGE, 'bot');
    } finally {
      removeTempLabel('stall');
      removeTempLabel('big-hint');
      isProcessing = false;
      userInput.disabled = false;
      const sendButtonFinal = document.getElementById('sendBtn');
      if (sendButtonFinal) {
        sendButtonFinal.disabled = false;
      }
    }
  };

  const insertQuery = text => {
    userInput.value = text;
    userInput.focus();
    userInput.dispatchEvent(new Event('input'));
  };

  const showAbout = () => openModal('aboutModal');
  const showDisclaimer = () => openModal('disclaimerModal');
  const showResetConfirm = () => openModal('resetModal');

  const openModal = id => {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.add('active');
    }
  };

  const closeModal = id => {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.remove('active');
    }
  };

  const confirmReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(NOTICE_KEY);
    closeModal('resetModal');
    chatArea.innerHTML = '';
    showWelcome();
  };

  const displayUserName = () => {
    const userName = (localStorage.getItem(USER_NAME_KEY) || '').trim();
    const badge = document.getElementById('userNameBadge');
    const valueElement = document.getElementById('userNameValue');
    const closeButton = document.getElementById('userNameClose');
    if (userName && badge && valueElement) {
      valueElement.textContent = userName;
      badge.classList.add('show');
    } else if (badge) {
      badge.classList.remove('show');
    }
    if (closeButton) {
      closeButton.addEventListener('click', () => badge && badge.classList.remove('show'));
    }
  };

  if (noticeCloseBtn) {
    noticeCloseBtn.addEventListener('click', () => {
      if (noticeAutoHideHandle) {
        clearTimeout(noticeAutoHideHandle);
        noticeAutoHideHandle = null;
      }
      if (noticeBanner) {
        noticeBanner.classList.add('hidden');
      }
      localStorage.setItem(NOTICE_KEY, 'true');
    });
  }

  if (userInput) {
    userInput.addEventListener('input', () => {
      userInput.style.height = 'auto';
      userInput.style.height = `${Math.min(userInput.scrollHeight, 110)}px`;
    });
    userInput.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    });
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeModal('aboutModal');
      closeModal('disclaimerModal');
      closeModal('resetModal');
    }
  });

  window.sendMessage = sendMessage;
  window.showAbout = showAbout;
  window.showDisclaimer = showDisclaimer;
  window.showResetConfirm = showResetConfirm;
  window.closeModal = closeModal;
  window.confirmReset = confirmReset;
  window.insertQuery = insertQuery;

  handleNotice();
  loadMessages();
  handleWeather();
  displayUserName();

  window.addEventListener('resize', () => {
    if (!localStorage.getItem(NOTICE_KEY)) {
      handleNotice();
    }
  });
}
