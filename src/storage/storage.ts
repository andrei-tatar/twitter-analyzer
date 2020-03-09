import { MonoTypeOperatorFunction } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SocialMediaMessageEvent } from '../common';

export function storeMessageEvent(): MonoTypeOperatorFunction<SocialMediaMessageEvent> {
    return source => source.pipe(
        tap(ev => {

        }),
    );
}