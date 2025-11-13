'use strict';

import { SANITIZE_TOKEN } from './constants.js';

const pickVariant = list => list[Math.floor(Math.random() * list.length)];
const sanitizeStreamText = text => (text || '').replace(SANITIZE_TOKEN, '');

export { pickVariant, sanitizeStreamText };
