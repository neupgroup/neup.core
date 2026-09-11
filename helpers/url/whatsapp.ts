import { messageFactory, queryBody } from './shared';

export const whatsapp = messageFactory((number, body) =>
  `whatsapp://send?phone=${number.replace(/^\+/, '')}${queryBody(body, 'text', '&')}`,
);
