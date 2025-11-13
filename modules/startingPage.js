'use strict';

import { SKIP_KEY, START_DESTINATION, USER_NAME_KEY } from './constants.js';

export function initStartingPage() {
  const introCard = document.getElementById('introCard');
  const enterBtn = document.getElementById('enterBtn');
  const skipToggle = document.getElementById('skipToggle');
  const disclaimerBtn = document.getElementById('disclaimerBtn');
  const disclaimerModal = document.getElementById('disclaimerModal');
  const closeDisclaimer = document.getElementById('closeDisclaimer');
  const nameFormModal = document.getElementById('nameFormModal');
  const nameForm = document.getElementById('nameForm');
  const userNameInput = document.getElementById('userName');

  const showNameForm = () => {
    if (nameFormModal) {
      nameFormModal.classList.add('active');
      if (userNameInput) {
        setTimeout(() => userNameInput.focus(), 100);
      }
    }
  };

  const navigateToApp = userName => {
    if (skipToggle && skipToggle.checked) {
      localStorage.setItem(SKIP_KEY, 'true');
    } else {
      localStorage.removeItem(SKIP_KEY);
    }
    if (userName) {
      localStorage.setItem(USER_NAME_KEY, userName);
    }
    if (nameFormModal) {
      nameFormModal.classList.remove('active');
    }
    if (introCard) {
      introCard.classList.add('leaving');
    }
    setTimeout(() => {
      window.location.href = START_DESTINATION;
    }, 450);
  };

  const openDisclaimer = () => {
    if (disclaimerModal) {
      disclaimerModal.classList.add('active');
    }
  };

  const closeDisclaimerModal = () => {
    if (disclaimerModal) {
      disclaimerModal.classList.remove('active');
    }
  };

  enterBtn && enterBtn.addEventListener('click', showNameForm);
  disclaimerBtn && disclaimerBtn.addEventListener('click', openDisclaimer);
  closeDisclaimer && closeDisclaimer.addEventListener('click', closeDisclaimerModal);
  disclaimerModal && disclaimerModal.addEventListener('click', event => {
    if (event.target === disclaimerModal) {
      closeDisclaimerModal();
    }
  });
  nameFormModal && nameFormModal.addEventListener('click', event => {
    if (event.target === nameFormModal) {
      nameFormModal.classList.remove('active');
    }
  });
  nameForm && nameForm.addEventListener('submit', event => {
    event.preventDefault();
    const value = (userNameInput && userNameInput.value || '').trim();
    if (value) {
      navigateToApp(value);
    }
  });
  window.addEventListener('load', () => {
    if (localStorage.getItem(SKIP_KEY) === 'true') {
      window.location.replace(START_DESTINATION);
    }
  });
}
