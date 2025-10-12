import { createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

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
    injected(), // MetaMask, Coinbase Wallet, etc.
    // WalletConnect is only added if a valid project ID is provided
    ...(walletConnectProjectId ? [walletConnect({ projectId: walletConnectProjectId })] : []),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});
