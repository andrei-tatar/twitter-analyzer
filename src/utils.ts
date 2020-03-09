export function isDefined<T>(item?: T | undefined | null): item is T {
    return item !== void 0 && item !== null;
}