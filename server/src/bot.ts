import { Telegraf, Context as TelegramContext } from 'telegraf'
import type { Env, KeyPair } from './types';
import type { Context } from 'hono';
import { buildActionCall } from './calls';
import { Hex, P256, Signature, type Address, Value } from 'ox';
import { porto, publicClient } from './config';
import { Chains } from 'porto';
import { NonRetryableError } from 'cloudflare:workflows';
import { ExperimentERC20 } from './contracts';

export const createBot = (token: string, _context: Context<{
  Bindings: Env;
}>) => {
    const bot = new Telegraf<TelegramContext>(token);
    const clientUrl = _context.env.CLIENT_URL??'';
    const context = _context;

    const availableCommands = [
      '/start - Start the bot',
      '/help - Show this help message',
      '/status - Check bot status',
      '/register - Register your account',
      '/mint - Mint 10 EXP1',
      '/wallet_info - Check your wallet info',
      '/remove - Remove your account',
    ];
  
      // Basic command handlers
      bot.command('start', async (ctx) => {
        await ctx.reply('Welcome to the experimental bot! Use /help to see available commands.\n\n'
          +  'Available commands:\n' +
          availableCommands.join('\n')
        );
      });
  
      bot.command('help', async (ctx) => {
        await ctx.reply(
          'Available commands:\n' +
          availableCommands.join('\n')
        );
      });
  
      bot.command('status', async (ctx) => {
        await ctx.reply('Bot is operational! 🚀');
      });
  
      bot.command('register', async (ctx) => {
        try {
        const chatId = ctx.chat.id;
        const userId = ctx.from?.id;
        const username = ctx.from?.username;
  
        if (!userId || !username) {
          await ctx.reply('Please provide your username first. Use /start to get started.');
          return;
        }

        const telegramUserId = BigInt(ctx.from!.id);
        const userName = ctx.from!.username;
  
        const keyPair = await context.env.DB.prepare(
          /* sql */ `SELECT * FROM keypairs WHERE telegram_user_id = ?;`,
        )
        .bind(telegramUserId.toString())
        .first<KeyPair>()

        if (keyPair) {
          const { address } = keyPair;
          await ctx.reply(`Hey ${userName}! \n\nYou are already registered. \n\nYour wallet address is ${address}.`);
          return;
        }
        
        await ctx.reply(`Hey ${userName}! \n\nVisit ${clientUrl}/?telegramUserId=${telegramUserId.toString()} to register. \n\nAnd get started.`);
        return;
      } catch (error) {
        // @ts-ignore
        console.info('Error registering user:', error.message);
        await ctx.reply('An error occurred while registering. Please try again later.' );
      }
      });

      bot.command('mint', async (ctx) => {
        try {
          const userId = ctx.from?.id;
          const username = ctx.from?.username;
          const telegramUserId = BigInt(ctx.from!.id);

          if (!userId || !username) {
            await ctx.reply('Please provide your username first. Use /start to get started.');
            return;
          }
          
          const keyPair = await context.env.DB.prepare(
            /* sql */ `SELECT * FROM keypairs WHERE telegram_user_id = ?;`,
          )
          .bind(telegramUserId.toString())
          .first<KeyPair>()
  
          if (!keyPair) {
            await ctx.reply('Please register first. Use /register to get started.');
            return;
          }

          ctx.reply('Minting tokens...Please wait...');
          
          const { address } = keyPair;
  
          const mintCall = buildActionCall({
            action: 'mint',
            account: address as Address.Address,
          });
  
          const { digest, ...request } = await porto.provider.request({
            method: 'wallet_prepareCalls',
            params: [
              {
                from: address as `0x${string}`,
                calls: mintCall,
                chainId: Hex.fromNumber(Chains.odysseyTestnet.id),
              },
            ],
          })
  
          const signature = Signature.toHex(
            P256.sign({
              payload: digest,
              privateKey: keyPair.private_key,
            }),
          )
  
          const [sendPreparedCallsResult] = await porto.provider.request({
            method: 'wallet_sendPreparedCalls',
            params: [
              {
                ...request,
                signature: {
                  value: signature,
                  type: keyPair.type,
                  publicKey: keyPair.public_key,
                },
              },
            ],
          })
  
          const hash = sendPreparedCallsResult?.id
  
          if (!hash) {
            await ctx.reply('Failed to mint tokens. Please try again.');
            return;
          }
  
          const insertTransaction = await context.env.DB.prepare(
            /* sql */ `INSERT INTO transactions (address, hash, role, public_key) VALUES (?, ?, ?, ?)`,
          )
          .bind(address, hash, keyPair.role, keyPair.public_key)
          .run()
          
          await ctx.reply(`Minted 10 EXP1 to ${address}. Hash: ${hash}`);
  
          if (!insertTransaction.success) {
            throw new NonRetryableError('failed to insert transaction')
          }
  
          console.info(`transaction inserted: ${hash}`)
        } catch (error) {
          // @ts-ignore
          console.info('Error minting tokens:', error.message);
          await ctx.reply('An error occurred while minting tokens. Please try again later.' );
        }
      });
      
      bot.command('wallet_info', async (ctx) => {
        try {
        const telegramUserId = BigInt(ctx.from!.id);

        const keyPair = await context.env.DB.prepare(
          /* sql */ `SELECT * FROM keypairs WHERE telegram_user_id = ?;`,
        )
        .bind(telegramUserId.toString())
        .first<KeyPair>()

        if (!keyPair) {
          await ctx.reply('Please register first. Use /register to get started.');
          return;
        }

        const { address } = keyPair;

       const exp1Balance = await publicClient.readContract({
        address: ExperimentERC20.address[0],
        abi: ExperimentERC20.abi,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
       })

       const exp2Balance = await publicClient.readContract({
        address: ExperimentERC20.address[1],
        abi: ExperimentERC20.abi,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
       })

       const formattedExp1Balance = Value.formatEther(exp1Balance)
       const formattedExp2Balance = Value.formatEther(exp2Balance)

       await ctx.reply(`Your balance is ${formattedExp1Balance} EXP1 and ${formattedExp2Balance} EXP2`);
        } catch (error) {
          // @ts-ignore
          console.info('Error getting wallet info:', error.message);
          await ctx.reply('An error occurred while getting wallet info. Please try again later.' );
        }
      });
      
      bot.command('remove', async (ctx) => {
        try {
        const userId = ctx.from?.id;
        const username = ctx.from?.username;
        const telegramUserId = BigInt(ctx.from!.id);

        if (!userId || !username) {
          await ctx.reply('Please provide your username first. Use /start to get started.');
          return;
        }

        const removeUser = await context.env.DB.prepare(
          /* sql */ `DELETE FROM keypairs WHERE telegram_user_id = ?;`,
        )
        .bind(telegramUserId.toString())
        .run()

        if (!removeUser.success) {
          throw new NonRetryableError('failed to remove user')
        }

        await ctx.reply('Your account has been removed. Use /register to get registered again.');
        } catch (error) {
          // @ts-ignore
          console.info('Error removing user:', error.message);
          await ctx.reply('An error occurred while removing user. Please try again later.' );
        }
      });
  
      // Handle text messages
      bot.on('text', async (ctx) => {
        const message = ctx.message.text;
        await ctx.reply(`Received: ${message}`);
      });
  
      // Error handling
      bot.catch((err) => {
        console.error('Bot error:', err);
      });
    return bot;
  };