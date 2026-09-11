import { messageFactory, queryBody } from './shared';

export const sms = messageFactory((number, body) => `sms:${number}${queryBody(body)}`);
