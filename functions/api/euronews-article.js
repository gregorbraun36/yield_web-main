import handler from '../../api/euronews-article.js';
import { adapt } from '../_lib/adapt.js';

export const onRequest = adapt(handler);
