import { RawDataApi } from './raw-data.api';
import { writeFile, mkdir } from 'fs/promises';
import * as path from 'path';

const id = 'Hamie#21834'.replace('#', '-');

const api = new RawDataApi().get(id).catch(err => console.error(err));

api.then(async (data: unknown) => {
    const filePath = `api/raw-data/${id.toLowerCase()}.json`;
    const dir = path.dirname(filePath);
    try {
        await mkdir(dir, { recursive: true });
    } catch (err) {
        console.error('mkdir error', err);
        throw err;
    }

    try {
        await writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error(err);
    }
}).catch(err => console.error(err));