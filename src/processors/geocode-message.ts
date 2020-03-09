import { Client } from '@googlemaps/google-maps-services-js';
import { defer, of, OperatorFunction } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { SocialMediaMessageEvent } from '../common';
import { GOOGLE_API_KEY } from '../config';

const client = new Client({});

export function geocodeMessage(): OperatorFunction<SocialMediaMessageEvent, MessageWithLocation> {
    return source => source.pipe(
        concatMap(msg => {
            if (msg.user.location) {
                const address = msg.user.location;
                return defer(async () => {
                    return {
                        message: msg,
                        location: await getLocationFromAddress(address),
                    };
                });
            }

            return of({
                message: msg,
                location: null,
            });
        }),
    )
}

async function getLocationFromAddress(address: string): Promise<MessageWithLocation['location']> {
    const response = await client.geocode({
        params: {
            key: GOOGLE_API_KEY,
            address,
        },
    });

    if (response.data.status !== 'OK') {
        return null;
    }

    const firstResult = response.data.results[0];
    if (!firstResult) {
        return null;
    }

    const country = firstResult.address_components.find(a => a.types.includes('country'));
    if (!country) {
        return null;
    }

    const coord = firstResult.geometry.location;
    return {
        country: country.long_name,
        coords: [coord.lat, coord.lng],
    };
}

export interface MessageWithLocation {
    message: SocialMediaMessageEvent;
    location: {
        country: string;
        coords: [number, number];
    } | null;
}