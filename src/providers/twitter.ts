import { Observable } from 'rxjs';
import { delay, retryWhen, switchMap, tap } from 'rxjs/operators';
import Twitter from 'twit';
import { SocialMediaMessageEvent } from '../common';
import { TWITTER } from '../config';

export function getTwitterEvents(track$: Observable<string>) {
    return track$.pipe(
        switchMap(track => new Observable<SocialMediaMessageEvent>(observer => {
            const client = new Twitter(TWITTER);

            const stream = client.stream('statuses/filter', {
                track,
            });

            stream.on('tweet', (tweet) => {
                observer.next({
                    id: tweet.id_str,
                    text: tweet.text,
                    replyToMessageId: tweet.in_reply_to_status_id_str ?? undefined,
                    replyToUserId: tweet.in_reply_to_user_id_str ?? undefined,
                    user: {
                        id: tweet.user.id_str,
                        name: tweet.user.name,
                        location: tweet.user.location ?? undefined,
                    },
                });
            });
            stream.on('close', () => observer.complete());
            stream.on('error', err => observer.error(err));

            return () => stream.stop();
        }).pipe(
            retryWhen(err$ => err$.pipe(
                tap(err => console.warn(`error during twitter stream; retrying in 5 sec ${err}`)),
                delay(5000),
            ))
        )),
    );
}
