import { Implementation, Porto } from 'porto'
import { odysseyTestnet } from 'porto/Chains'
import { createPublicClient, http } from 'viem'
import { odysseyTestnet as viemOdysseyTestnet } from 'viem/chains'

export const porto = Porto.create({
  chains: [odysseyTestnet],
  implementation: Implementation.local(),
})

export const publicClient = createPublicClient({
  chain: viemOdysseyTestnet,
  transport: http()
})
