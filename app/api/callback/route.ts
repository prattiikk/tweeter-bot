// app/api/callback/route.js
import { TwitterApi } from 'twitter-api-v2';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const twitterClient = new TwitterApi({
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
});

const callbackURL = `${process.env.NEXT_PUBLIC_BASE_URL}/api/callback`;

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const state = searchParams.get('state');
        const code = searchParams.get('code');

        // Retrieve verifier and state from Prisma
        const token = await prisma.token.findFirst({
            where: { state },
        });

        if (!token || state !== token.state) {
            return new Response(JSON.stringify({ error: 'State mismatch or not found' }), {
                status: 400,
            });
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

        return new Response(JSON.stringify(data), { status: 200 });
    } catch (error) {
        console.error(error);
        return new Response(
            JSON.stringify({ error: 'Error during Twitter login' }),
            { status: 500 }
        );
    }
}
