import { Implementation, Porto } from 'porto'
import { createClient, custom } from 'viem'
import { http, createConfig, createStorage } from 'wagmi'
import { odysseyTestnet } from 'wagmi/chains'

export const porto = Porto.create({
  implementation: Implementation.dialog({
    host: `https://exp.porto.sh/dialog`,
  }),
})

export const wagmiConfig = createConfig({
  chains: [odysseyTestnet],
  storage: createStorage({ storage: window.localStorage }),
  transports: {
    [odysseyTestnet.id]: http(),
  },
})

export const client = createClient({
  transport: custom(porto.provider),
})
