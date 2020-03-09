import { Observable, Subject } from 'rxjs';
import { distinctUntilChanged, first, map, shareReplay, startWith } from 'rxjs/operators';

const update$ = new Subject<Settings>();

export function settingsMap<T>(mapper: (s: Settings) => T): Observable<T> {
    return settings$.pipe(
        map(mapper),
        distinctUntilChanged((a, b) => a === b),
    );
}

export async function updateSettings(update: Partial<Settings>) {
    const settings = await settings$.pipe(first()).toPromise();
    const clone: any = { ...settings };
    for (const [key, value] of Object.entries(update)) {
        if (key in clone && typeof value === typeof clone[key]) {
            clone[key] = value;
        }
    }
    update$.next(clone);
}

export const settings$ = update$.pipe(
    startWith({
        track: '#covid-19',
        windowSizeSeconds: 1800,
        threshold: .2,
    }),
    shareReplay(1),
);

export interface Settings {
    track: string;
    windowSizeSeconds: number;
    threshold: number;
}