// pages/api/tweet.js
import { TwitterApi } from 'twitter-api-v2';
// import { Configuration, OpenAIApi } from 'openai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize Twitter client
const twitterClient = new TwitterApi({
  clientId: process.env.TWITTER_CLIENT_ID,
  clientSecret: process.env.TWITTER_CLIENT_SECRET,
});

// // Initialize OpenAI client
// const openai = new OpenAIApi(
//   new Configuration({
//     organization: process.env.OPENAI_ORG,
//     apiKey: process.env.OPENAI_SECRET,
//   })
// );

export default async function handler(req, res) {
  try {
    // Retrieve refresh token from Prisma
    const token = await prisma.token.findFirst();

    if (!token || !token.refreshToken) {
      return res.status(400).json({ error: 'No valid refresh token found' });
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

    // // Generate tweet content using OpenAI
    // const nextTweet = await openai.createCompletion({
    //   model: 'text-davinci-003',
    //   prompt: 'Tweet something cool for #techtwitter',
    //   max_tokens: 64,
    // });

    // Post tweet to Twitter
    // const { data } = await refreshedClient.v2.tweet(nextTweet.data.choices[0].text);
    const { data } = await refreshedClient.v2.tweet("hi there !");


    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error posting tweet' });
  }
}
