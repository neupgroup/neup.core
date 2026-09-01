import identity from '$/identity.json';

export function getName(): string {
    return identity.name;
}

export function getDescription(): string {
    return identity.description;
}

export function getLogo(): string {
    return identity.logo;
}
