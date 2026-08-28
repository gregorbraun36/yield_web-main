import handler from '../../api/send-email.js';
import { adapt } from '../_lib/adapt.js';

export const onRequest = adapt(handler);
