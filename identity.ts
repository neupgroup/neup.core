import identityConfig from '@base/identity.json';
import assetsConfig from '@base/assets.json';

type ApplicationIdentity = {
    name?: string;
    description?: string;
    logo?: string;
    assets?: {
        logo?: {
            main?: string;
        };
    };
};

const identity = identityConfig as ApplicationIdentity;
const assets = assetsConfig as ApplicationIdentity['assets'];

export function getName(): string {
    return identity.name ?? '';
}

export function getDescription(): string {
    return identity.description ?? '';
}

export function getLogo(): string {
    return identity.logo ?? assets?.logo?.main ?? '';
}
