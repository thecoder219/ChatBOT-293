'use strict';
// THE API KEY I HAVE USED, WILL BE DELETED ONCE DEMOMED SITE GOES OFFLINE. BETTER DON'T ATTEMPT TAMPERING!
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const __k1 = 'c2stb3ItdjEtNTQ3MmE0YWVmYTUyN2M4NTNhYWU5Nzk0NDc0MTZkYmZhZTg3ZjRlNjE5NWYyYjdkODk3NWYxNDVkN2I4MDkwZQ==';
const OPENROUTER_KEY = (typeof atob === 'function' ? atob(__k1) : Buffer.from(__k1, 'base64').toString('utf8'));
const SITE_URL = 'https://demomed.local';
const SITE_TITLE = 'DemoMed AI';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast?latitude=23.3441&longitude=85.3096&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&wind_speed_unit=kmh&timezone=Asia/Kolkata';
const WEATHER_REFRESH_INTERVAL = 15 * 60 * 1000;
const STORAGE_KEY = 'demomedai_messages';
const NOTICE_KEY = 'demomedai_notice_shown';
const USER_NAME_KEY = 'demomedai_userName';
const ERROR_MESSAGE = 'OUR SYSTEMS ARE FACING TECHNICAL PROBLEMS. KINDLY, CONTACT PRATYUSH TO RESOLVE THIS AS SOON AS POSSIBLE!';
const SANITIZE_TOKEN = /<\uFF5Cb\u0065gin▁of▁sentence\uFF5C>|<\|begin_of_sentence\|>/g;
const APP_GREETING_VARIANTS = [
  'Hello! Welcome to DemoMed AI, created by a specific group of Pratyush, Prabhakar, and Abhiraj as a school (LKCRMS) practical project for Batch 2025-26.',
  'Hi there! This is DemoMed AI, built by Pratyush, Prabhakar, and Abhiraj for LKCRMS Batch 2025-26.',
  'Hey! You\'re chatting with DemoMed AI - a LKCRMS Batch 2025-26 project by Pratyush, Prabhakar, and Abhiraj.'
];
const APP_NAME_VARIANTS = [
  'I go by DemoMed AI - your medical helper.',
  'You can call me DemoMed AI, a classroom-built assistant.',
  'DemoMed AI here - focused on medical queries.'
];
const APP_CREATOR_VARIANTS = [
  'I was made by Pratyush, the developer and maintainer of this site, along with Abhiraj and Prabhakar as teammates who helped with expenses like the domain and other project needs.',
  'Pratyush built and maintains me; Abhiraj and Prabhakar teamed up handling project and domain expenses.',
  'Created by Pratyush (dev and maintainer) with teammates Abhiraj and Prabhakar supporting costs like the domain and other needs.'
];
const NON_MEDICAL_RESPONSE = 'I am made specifically for medical related topics. Kindly ask questions about medicine, medical problems, health, or even the history of medicine and related fields. Please avoid questions from other areas, as I am not optimized for them right now.';
const WEATHER_CODES = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Icy fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  56: 'Freezing drizzle',
  57: 'Heavy freezing drizzle',
  61: 'Light rain',
  63: 'Rain showers',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Heavy freezing rain',
  71: 'Light snow',
  73: 'Snowfall',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Light showers',
  81: 'Showers',
  82: 'Heavy showers',
  85: 'Snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Storm with hail',
  99: 'Severe storm'
};
const SKIP_KEY = 'demomedai_skip_intro';
const START_DESTINATION = 'main_page.html';

export {
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
  SANITIZE_TOKEN,
  APP_GREETING_VARIANTS,
  APP_NAME_VARIANTS,
  APP_CREATOR_VARIANTS,
  NON_MEDICAL_RESPONSE,
  WEATHER_CODES,
  SKIP_KEY,
  START_DESTINATION
};
