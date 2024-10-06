// @ts-nocheck
import { TwitterApi } from 'twitter-api-v2';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize Twitter client
const twitterClient = new TwitterApi({
  clientId: process.env.TWITTER_CLIENT_ID,
  clientSecret: process.env.TWITTER_CLIENT_SECRET,
});

export async function POST() {
  try {
    // Retrieve refresh token from Prisma
    const token = await prisma.token.findFirst();

    if (!token || !token.refreshToken) {
      return new Response(
        JSON.stringify({ error: 'No valid refresh token found' }),
        { status: 400 }
      );
    }

    // Refresh OAuth2 tokens
    const {
      client: refreshedClient,
      accessToken,
      refreshToken: newRefreshToken,
    } = await twitterClient.refreshOAuth2Token(token.refreshToken);

    // Update tokens in Prisma
    await prisma.token.update({
      where: { id: token.id },
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });

    // Post a generic tweet
    const { data } = await refreshedClient.v2.tweet('Hello, world! This is an automated tweet.');

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: 'Error posting tweet' }),
      { status: 500 }
    );
  }
}
