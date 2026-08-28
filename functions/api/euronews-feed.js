import handler from '../../api/euronews-feed.js';
import { adapt } from '../_lib/adapt.js';

export const onRequest = adapt(handler);
