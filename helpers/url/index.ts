import { web } from './web';
import { email } from './email';
import { phone } from './phone';
import { sms } from './sms';
import { geo } from './geo';
import { whatsapp } from './whatsapp';
import { viber } from './viber';
import { facetime } from './facetime';
import { skype } from './skype';
import { telegram } from './telegram';
import { maps } from './maps';
import { webcal } from './webcal';
import { ftp } from './ftp';
import { intent } from './intent';

/**
 * Phone builders: country('np').number('9840710507'), or number('+9779840710507').
 * country() prefixes national digits without rewriting trunk codes.
 * After number(), only body() (for messages), protect(), and get() are available.
 * protect() is a placeholder returning only get(); it does not alter the URI.
 */
export const url = {
  web,
  email,
  phone,
  sms,
  geo,
  whatsapp,
  viber,
  facetime,
  skype,
  telegram,
  maps,
  webcal,
  ftp,
  intent,
  tg: telegram,
};

export default url;
