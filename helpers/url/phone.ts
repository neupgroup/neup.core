import { phoneFactory, protectable } from './shared';

export const phone = phoneFactory((number) => protectable(`tel:${number}`));
