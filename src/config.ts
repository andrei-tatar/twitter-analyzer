export const TWITTER = {
    consumer_key: process.env.TWITTER_KEY ?? '',
    consumer_secret: process.env.TWITTER_SECRET ?? '',
    access_token: process.env.TWITTER_ACCESS_TOKEN ?? '',
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET ?? '',
};

export const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY ?? '';

export const MONGO_CONNECTION = process.env.MONGODB_URI ?? '';
export const PORT = parseInt(process.env.PORT ?? '3000', 10);

export const MONGO_ARCHIVE_COUNT = 100e3;