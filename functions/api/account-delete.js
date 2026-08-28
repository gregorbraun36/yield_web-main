import handler from '../../api/account-delete.js';
import { adapt } from '../_lib/adapt.js';

export const onRequest = adapt(handler);
