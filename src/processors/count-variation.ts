import { Observable, OperatorFunction } from 'rxjs';
import { concatMap, scan, withLatestFrom } from 'rxjs/operators';
import { CountByLocation } from './count-by-location';

export function detectMessageCountVariationByLocation(threshold$: Observable<number>): OperatorFunction<CountByLocation, CountVariationAlert> {
    return source => source.pipe(
        withLatestFrom(threshold$),
        scan((ctx, [current, threshold]) => {
            ctx.alerts.splice(0, ctx.alerts.length);

            if (ctx.last !== void 0) {
                for (const [country, count] of Object.entries(current)) {
                    const lastCount = ctx.last[country];
                    if (!lastCount) continue;

                    const change = (count - lastCount) / lastCount;
                    if (change > threshold) {
                        ctx.alerts.push({
                            type: 'count-variation-alert',
                            change,
                            at: new Date().toString(),
                            country,
                        });
                    }
                }
            }

            ctx.last = current;
            return ctx;
        }, { alerts: [] } as {
            last?: CountByLocation;
            alerts: CountVariationAlert[];
        }),
        concatMap(ctx => ctx.alerts),
    );
}

export interface CountVariationAlert {
    type: 'count-variation-alert';
    change: number;
    at: string;
    country: string;
}