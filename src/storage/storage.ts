import { Collection, MongoClient } from 'mongodb';
import { defer, from, MonoTypeOperatorFunction } from 'rxjs';
import { bufferCount, concatMap, filter, map, publishReplay, refCount, switchMap, withLatestFrom } from 'rxjs/operators';
import { SocialMediaMessageEvent } from '../common';
import { MONGO_ARCHIVE_COUNT, MONGO_CONNECTION } from '../config';
import { isDefined } from '../utils';

export function storeMessageEvent(): MonoTypeOperatorFunction<SocialMediaMessageEvent> {
    return source => source.pipe(
        withLatestFrom(msgCollection$),
        concatMap(([message, collection]) => collection.insertOne(message).then(_ => message)),
    );
}

const msgCollection$ = defer(() => MongoClient.connect(MONGO_CONNECTION))
    .pipe(
        map(client => client.db().collection('messages')),
        publishReplay(1),
        refCount(),
    );

async function archiveOlderMessages(
    collection: Collection<SocialMediaMessageEvent>,
    archive: Collection<SocialMediaMessageEvent>,
) {
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
}
