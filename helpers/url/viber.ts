import { phoneFactory, protectable } from './shared';

export const viber = phoneFactory((number) => protectable(`viber://chat?number=${encodeURIComponent(number)}`));
