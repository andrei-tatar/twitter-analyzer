import { Collection, MongoClient } from 'mongodb';
import { defer, from, interval, merge, MonoTypeOperatorFunction } from 'rxjs';
import { bufferCount, concatMap, filter, ignoreElements, map, publishReplay, refCount, switchMap, withLatestFrom } from 'rxjs/operators';
import { SocialMediaMessageEvent } from '../common';
import { MONGO_ARCHIVE_COUNT, MONGO_CONNECTION } from '../config';
import { isDefined } from '../utils';

const db$ = defer(() => MongoClient.connect(MONGO_CONNECTION))
    .pipe(
        map(client => client.db()),
        publishReplay(1),
        refCount(),
    );

const msgCollection$ = db$.pipe(map(db => db.collection('messages')));
const msgArchiveCollection$ = db$.pipe(map(db => db.collection('messages-archive')));

const archiveOlderMessagesPeriodically$ = interval(10 * 60 * 1000).pipe(
    withLatestFrom(msgCollection$, msgArchiveCollection$),
    switchMap(([_, collection, archive]) => archiveOlderMessages(collection, archive)),
    ignoreElements(),
);

export function storeMessageEvent(): MonoTypeOperatorFunction<SocialMediaMessageEvent> {
    return source => merge(source, archiveOlderMessagesPeriodically$).pipe(
        withLatestFrom(msgCollection$),
        concatMap(([message, collection]) => collection.insertOne(message).then(_ => message)),
    );
}

async function archiveOlderMessages(
    collection: Collection<SocialMediaMessageEvent>,
    archive: Collection<SocialMediaMessageEvent>,
) {
    try {
        const count = await collection.countDocuments();
        if (count > MONGO_ARCHIVE_COUNT) {
            const countToArchive = MONGO_ARCHIVE_COUNT - count;
            const idsToArchive = await collection.find().map(d => d.id).limit(countToArchive).toArray();

            await from(idsToArchive).pipe(
                switchMap(id => collection.findOne({ id })),
                filter(isDefined),
                bufferCount(20),
                switchMap(items => archive.insertMany(items)),
            ).toPromise();
        }
    } catch (err) {
        console.warn('error during archiving', err);
    }
}
