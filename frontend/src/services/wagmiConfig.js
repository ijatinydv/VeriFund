import { createConfig } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { InjectedConnector } from '@wagmi/connectors/injected';
import { WalletConnectConnector } from '@wagmi/connectors/walletConnect';
import { http } from 'viem';

// Optional: Get your WalletConnect project ID from https://cloud.walletconnect.com
// To enable WalletConnect, sign up at https://cloud.walletconnect.com and replace with your project ID
const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

/**
 * Wagmi configuration for VeriFund
 * Supports Mainnet and Sepolia testnet with multiple wallet connectors
 */
export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    new InjectedConnector({ chains: [mainnet, sepolia] }), // MetaMask, Coinbase Wallet, etc.
    // WalletConnect is only added if a valid project ID is provided
    ...(walletConnectProjectId 
      ? [new WalletConnectConnector({ 
          chains: [mainnet, sepolia],
          options: { projectId: walletConnectProjectId }
        })] 
      : []),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});
