import { Queue } from 'bullmq';
import { redis } from './src/utils/redis.js';

const q = new Queue('scrape-queue', { connection: redis });

const [active, waiting, failed] = await Promise.all([
    q.getActive(),
    q.getWaiting(),
    q.getFailed()
]);

console.log('Active:', active.length, 'Waiting:', waiting.length, 'Failed:', failed.length);

if (waiting.length > 0) {
    console.log('Waiting jobs:');
    waiting.forEach(job => console.log('  -', job.id, job.data));
}

await q.close();
await redis.quit();
