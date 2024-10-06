// pages/api/callback.js
import { TwitterApi } from 'twitter-api-v2';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize Twitter client
const twitterClient = new TwitterApi({
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
});

const callbackURL = `${process.env.NEXT_PUBLIC_BASE_URL}/api/callback`;

export default async function handler(req, res) {
    try {
        const { state, code } = req.query;

        // Retrieve verifier and state from Prisma
        const token = await prisma.token.findFirst({
            where: { state },
        });

        if (!token || state !== token.state) {
            return res.status(400).json({ error: 'State mismatch or not found' });
        }

        // Complete Twitter OAuth flow
        const {
            client: loggedClient,
            accessToken,
            refreshToken,
        } = await twitterClient.loginWithOAuth2({
            code,
            codeVerifier: token.codeVerifier,
            redirectUri: callbackURL,
        });

        // Update tokens in Prisma
        await prisma.token.update({
            where: { state },
            data: {
                accessToken,
                refreshToken,
            },
        });

        // Get Twitter user data
        const { data } = await loggedClient.v2.me();

        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error during Twitter login' });
    }
}
