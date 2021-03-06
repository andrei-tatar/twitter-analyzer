import bodyParser from 'body-parser';
import express from 'express';
import { Server } from 'http';
import { join } from 'path';
import { Observable, Subject } from 'rxjs';
import { first, takeUntil } from 'rxjs/operators';
import socketIo from 'socket.io';

import { PORT } from './config';
import { settings$, updateSettings } from './settings';

export function createServer<TAnnomaly, THeatMap>(info: {
    alerts$: Observable<TAnnomaly>,
    heatMap$: Observable<THeatMap>
}) {
    return new Observable<never>(_ => {
        const app = express();

        app.use(express.static(join(__dirname, 'client')));
        app.use(bodyParser.json());


        const api = express.Router();
        api.get('/settings', async (_req, res) => {
            const settings = await settings$.pipe(first()).toPromise();
            res.json(settings);
        });

        api.patch('/settings', async (req, res) => {
            await updateSettings(req.body);
            res.status(204).send();
        });

        app.use('/api', api);

        const server = new Server(app);
        const io = socketIo(server);

        io.on('connection', socket => {
            const stop$ = new Subject();
            info.heatMap$
                .pipe(takeUntil(stop$))
                .subscribe(map => socket.emit('heatmap', map));

            info.alerts$
                .pipe(takeUntil(stop$))
                .subscribe(alert => socket.emit('alert', alert));

            socket.on('disconnect', () => stop$.next());
        });

        server.listen(PORT, () => {
            console.log('server is running');
        });

        return () => server.close();
    });
}

