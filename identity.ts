import application from '@base/application.json';

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

const identity = application as ApplicationIdentity;

export function getName(): string {
    return identity.name ?? '';
}

export function getDescription(): string {
    return identity.description ?? '';
}

export function getLogo(): string {
    return identity.logo ?? identity.assets?.logo?.main ?? '';
}
