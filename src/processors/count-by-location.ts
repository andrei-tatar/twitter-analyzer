import { OperatorFunction } from 'rxjs';
import { reduce, startWith } from 'rxjs/operators';

import { MessageWithLocation } from './geocode-message';

export function countByLocation(): OperatorFunction<MessageWithLocation, CountByLocation> {
    return source => source.pipe(
        reduce((ctx, msg) => {
            const country = msg.location?.country ?? '';
            if (!(country in ctx)) {
                ctx[country] = 1;
            } else {
                ctx[country] = ctx[country] + 1;
            }

            return ctx;
        }, {} as CountByLocation),
    )
}

export interface CountByLocation {
    [location: string]: number;
}