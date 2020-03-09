import { defer, Observable, OperatorFunction } from 'rxjs';
import { scan, switchMap } from 'rxjs/operators';

import { MessageWithLocation } from './geocode-message';

export function getHeatMap(): OperatorFunction<Observable<MessageWithLocation>, HeatMap> {
    return source => source.pipe(
        switchMap(events =>
            defer(() => events.pipe(
                scan((ctx, message) => {
                    if (message.location) {
                        ctx.coordinates.push(message.location.coords)
                        ctx.tweets++;
                    } else {
                        ctx.untracked++;
                    }
                    return ctx;
                }, {
                    start: new Date().toString(),
                    coordinates: [] as [number, number][],
                    tweets: 0,
                    untracked: 0,
                })
            ))
        ),
    );
}

export interface HeatMap {
    start: string;
    coordinates: [number, number][];
    tweets: number;
    untracked: number;
}