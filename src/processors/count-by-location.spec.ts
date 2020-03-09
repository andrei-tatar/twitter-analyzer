import { expect } from 'chai';
import { EMPTY, from, Subject } from 'rxjs';
import { countByLocation } from './count-by-location';
import { MessageWithLocation } from './geocode-message';

describe('count-by-location', () => {
    const sut = countByLocation();

    it('should start with an empty value', async () => {
        // act
        const result = await sut(EMPTY).toPromise();

        // assert
        expect(result).deep.eq({});
    });

    it('should aggregate by location.country', async () => {

        // arrange
        const events = from<MessageWithLocation[]>([{
            location: {
                coords: [1, 2],
                country: 'RO',
            },
            message: null as any,
        }, {
            location: {
                coords: [1, 2],
                country: 'RO',
            },
            message: null as any,
        }, {
            location: {
                coords: [1, 2],
                country: 'BE',
            },
            message: null as any,
        }]);

        // act
        const result = await sut(events).toPromise();

        // assert
        expect(result).deep.eq({ 'RO': 2, 'BE': 1 });
    });

    it('should use empty string when location is null', async () => {
        // arrange
        const events = from<MessageWithLocation[]>([{
            location: null,
            message: null as any,
        }]);

        // act
        const result = await sut(events).toPromise();

        // assert
        expect(result).deep.eq({ '': 1 });
    });

    it('should complete only when source completes', async () => {
        // arrange
        const events = new Subject<MessageWithLocation>();
        let complete = false;

        // act
        sut(events).subscribe(() => { }, _ => { }, () => complete = true);

        // assert
        expect(complete).to.eq(false);
        events.next({} as any);
        expect(complete).to.eq(false);
        events.complete();
        expect(complete).to.eq(true);
    });
});