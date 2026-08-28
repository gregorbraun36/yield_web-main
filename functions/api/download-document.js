import handler from '../../api/download-document.js';
import { adapt } from '../_lib/adapt.js';

export const onRequest = adapt(handler);
