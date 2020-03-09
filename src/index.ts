import { concatMap, map, publish, refCount, shareReplay } from 'rxjs/operators';

import { createServer } from './app';
import { countByLocation } from './processors/count-by-location';
import { detectMessageCountVariationByLocation } from './processors/count-variation';
import { geocodeMessage } from './processors/geocode-message';
import { getHeatMap } from './processors/get-heat-map';
import { windowDynamicTime } from './processors/window';
import { getTwitterEvents } from './providers/twitter';
import { settingsMap } from './settings';
import { storeMessageEvent } from './storage/storage';

const track$ = settingsMap(s => s.track);
const windowSizeSeconds$ = settingsMap(s => s.windowSizeSeconds);
const threshold$ = settingsMap(s => s.threshold);

const messages$ = getTwitterEvents(track$).pipe(
    storeMessageEvent(),
);

const eventsInTimeWindow$ = messages$.pipe(
    geocodeMessage(),
    windowDynamicTime(windowSizeSeconds$),
    map(windowEvents => windowEvents.pipe(publish(), refCount())),
    publish(),
    refCount(),
);

const heatMap$ = eventsInTimeWindow$.pipe(
    getHeatMap(),
);

const annomalies$ = eventsInTimeWindow$.pipe(
    concatMap(events =>
        events.pipe(countByLocation()),
    ),
    detectMessageCountVariationByLocation(threshold$),
    shareReplay(10),
);

const sub = createServer({
    annomalies$,
    heatMap$,
}).subscribe();

process.on('SIGINT', () => {
    console.log('stopping');
    sub.unsubscribe();
});