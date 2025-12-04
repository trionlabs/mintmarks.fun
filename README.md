# mintmarks.fun

Soulbound NFTs that prove you actually attended an event, using zk-proofs of DKIM-signed emails.

## How It Works

Luma sends "Thanks for joining" emails only to people whose tickets were scanned at entry. Mintmarks verifies the DKIM signature of these emails in a ZK circuit, proving attendance without exposing any personal data. Optional ZKPassport integration prevents sybil attacks by tying each mint to a unique human identity.

**Two verification tiers:**
- **Email-only**: Proved you attended
- **Passport-verified**: Proved you're a unique human

## Project Structure

```
mintmarks.fun/
├── circuits/          # Noir ZK circuits for email verification
├── contracts/         # Solidity smart contracts (ERC-1155 soulbound tokens)
└── web/               # React frontend with Coinbase Smart Wallet integration
```

## Tech Stack

- **Circuits**: [Noir](https://noir-lang.org/) + [ZK-Email](https://prove.email/) for DKIM verification
- **Contracts**: Solidity, Foundry, deployed on Ethereum and Base Sepolia 
- **Frontend**: React, Vite, TailwindCSS
- **Wallets**: [Coinbase Smart Wallets](https://www.coinbase.com/en-gb/developer-platform) (gasless, email login) + [RainbowKit](https://rainbowkit.com) (EOA)
- **Identity**: [ZKPassport](https://zkpassport.id/) for sybil resistance

## Prerequisites

- Node.js >= 18
- [pnpm](https://pnpm.io/) >= 10
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Nargo](https://noir-lang.org/docs/getting_started/installation/) 1.0.0-beta.5

## Setup

```bash
# Clone with submodules
git clone --recursive https://github.com/trionlabs/mintmarks.fun.git
cd mintmarks.fun

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
# Fill in your values (RPC URLs, contract addresses, etc.)
```

## Development

### Circuits

```bash
cd circuits

# Compile the Noir circuit
pnpm build

# Run circuit tests
pnpm test

# Generate proof from an email
pnpm generate:proof path/to/email.eml

# Generate Solidity verifier
pnpm generate:verifier
```

### Contracts

```bash
cd contracts

# Build contracts
pnpm build

# Run tests
pnpm test

# Deploy (requires PRIVATE_KEY and RPC_URL in .env)
forge script script/DeployMintmarks.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast
```

### Web

```bash
cd web

# Start dev server
pnpm dev

# Build for production
pnpm build
```

## Environment Variables

See `.env.example` for all required variables:


## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Gmail API  │────▶│  ZK Circuit  │────▶│  Mintmarks.sol  │
│  (DKIM sig) │     │  (Noir/WASM) │     │  (ERC-1155)     │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │
                    ┌──────┴──────┐
                    │  ZKPassport │
                    │  (optional) │
                    └─────────────┘
```

## License

MIT
