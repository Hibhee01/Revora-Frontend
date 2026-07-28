# Network Switcher & Chain Mismatch Modal Pattern

## Overview & Philosophy
When a connected Web3 wallet is on a different blockchain network (chain) than required by the application (e.g. wallet connected to Ethereum Mainnet, but application requires Polygon PoS), users require **guidance, not blockage**.

The **Network Switcher Pattern** consists of:
1. **NetworkSwitcherBadge**: A non-intrusive status indicator in `AppShell` header displaying the active network or a warning badge when a chain mismatch is detected.
2. **ChainMismatchModal**: An accessible modal dialog presenting side-by-side chain chips (Wallet Connected vs. App Required), per-wallet capability microcopy, manual switch step-by-step guidance, and two clear resolution options (`"Switch in wallet"` and `"Change app network"`).

---

## Component Architecture

```
AppShell
 ├── NetworkSwitcherProvider (State Context)
 │    ├── NetworkSwitcherBadge (Header indicator)
 │    └── ChainMismatchModal (Modal Dialog)
 └── Main Application Content
```

---

## Side-by-Side Chain Chips Design

```
+------------------------------------+       +------------------------------------+
|  WARING BADGE: Wallet Connected    |  -->  |   SUCCESS BADGE: App Required      |
|  (Dot: #627eea) Ethereum Mainnet  |       |   (Dot: #8247e5) Polygon PoS       |
|  Chain ID: 1                       |       |   Chain ID: 137                    |
+------------------------------------+       +------------------------------------+
```

- **Wallet Connected Chip**: Highlighted with warning accent (`#f59e0b` / `rgba(245, 158, 11, 0.12)`).
- **Directional Arrow**: Indicates current -> target transition (RTL-aware with `transform: scaleX(-1)` under `[dir="rtl"]`).
- **App Required Chip**: Highlighted with target accent (`#10b981` / `rgba(16, 185, 129, 0.12)`).

---

## Per-Wallet Capability Matrix

| Wallet Provider | Auto-Switch Support | Primary Action CTA | Custom Guidance Copy |
|---|---|---|---|
| **MetaMask** | Yes (`wallet_switchEthereumChain`) | `"Switch to Polygon in wallet"` | Prompts user to confirm extension prompt. |
| **Rabby Wallet** | Yes | `"Switch to Polygon in wallet"` | Prompts approval in Rabby toolbar. |
| **Coinbase Wallet**| Yes | `"Switch to Polygon in wallet"` | Prompts approval in Coinbase extension/app. |
| **WalletConnect** | No (Mobile hardware/bridges) | `"Manual switch required in wallet"` (Disabled) | Guides user to open mobile wallet app and select network manually. |
| **Ledger Hardware**| No | `"Manual switch required in wallet"` (Disabled) | Guides user to select target app on physical Ledger device. |
| **Phantom** | Yes | `"Switch to Polygon in wallet"` | Prompts EVM network switch in Phantom. |
| **Generic / Other** | Yes (Default assumption) | `"Switch to Polygon in wallet"` | Prompts network update in connected wallet app. |

---

## Edge Case Handling

### 1. Unknown / Unrecognized Chain IDs
- When a user connects with an unknown custom network ID (e.g. `999999`), `getChainMetadata(999999)` returns a safe fallback object:
  - Name: `"Unknown Network (Chain ID: 999999)"`
  - Short Name: `"Chain 999999"`
  - Color: `#94a3b8` (neutral slate)

### 2. Offline / Disconnected Wallet
- When `isWalletConnected` is false, `ChainMismatchModal` switches to offline state:
  - Title: `"Wallet Offline or Disconnected"`
  - Icon: `WifiOff`
  - Notice: *"Your wallet appears to be offline or disconnected. Reconnect your wallet or change app target network."*

### 3. Right-to-Left (RTL) Layout
- Fully compliant with `[dir="rtl"]`:
  - Logical CSS properties (`margin-inline-start`, `border-inline-start`).
  - Directional transition arrow flips (`transform: scaleX(-1)`).

---

## Accessibility (WCAG 2.1 AA)

1. **WAI-ARIA Dialog Contract**:
   - `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`.
2. **Focus Management**:
   - Stores active element on open and restores focus on modal close.
   - Focus trap locks keyboard Tab / Shift+Tab within modal bounds.
   - Escape key closes modal.
3. **Contrast & Touch Targets**:
   - Meets 4.5:1 text contrast ratio on light and dark glassmorphic themes.
   - Touch targets maintain minimum height of 42px - 44px.
