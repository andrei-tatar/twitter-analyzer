import { interval, Observable, OperatorFunction } from 'rxjs';
import { switchMap, window } from 'rxjs/operators';

export function windowDynamicTime<T>(seconds$: Observable<number>): OperatorFunction<T, Observable<T>> {
    const window$ = seconds$.pipe(
        switchMap(seconds => interval(seconds * 1000)),
    );

    return source => source.pipe(
        window(window$),
    );
}