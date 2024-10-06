// @ts-nocheck
// app/api/auth/route.js
import { TwitterApi } from 'twitter-api-v2';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize Twitter client
const twitterClient = new TwitterApi({
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
});

const callbackURL = `http://localhost:3000/api/callback`;

export async function GET() {
    try {
        const { url, codeVerifier, state } = twitterClient.generateOAuth2AuthLink(
            callbackURL,
            { scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'] }
        );

        // Store verifier and state in Prisma
        await prisma.token.create({
            data: {
                state,
                codeVerifier,
            },
        });

        // Redirect to Twitter OAuth URL
        return new Response(null, {
            status: 302,
            headers: {
                Location: url,
            },
        });
    } catch (error) {
        console.error(error);
        return new Response(
            JSON.stringify({ error: 'Error generating auth URL' }),
            { status: 500 }
        );
    }
}
