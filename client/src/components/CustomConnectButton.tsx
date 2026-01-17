import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useEffect, useState } from 'react';
import { ChevronDown, Wallet } from 'lucide-react'; 

// Hilfsfunktion zur Namensauflösung
async function resolveBaseName(address: string): Promise<string | null> {
  const lower = address.toLowerCase();

  // 1. Hardcoded Test-Wallet (für deine Demo)
  if (lower.includes("ada0")) return "gelassen.base.eth";
  if (lower.includes("1289") || lower.includes("2767")) return "gelassen.eth";

  // 2. Echter API Check (falls Backend Route existiert)
  try {
    const response = await fetch(`/api/resolve-ens/${address}`);
    if (response.ok) {
      const data = await response.json();
      return data.ensName || null;
    }
  } catch (e) {
    console.error("Name resolution failed", e);
  }
  return null;
}

export const CustomConnectButton = () => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // State für den aufgelösten Namen
        const [displayName, setDisplayName] = useState<string>("");

        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated');

        // Effect: Name auflösen, wenn connected
        useEffect(() => {
          if (connected && account?.address) {
            // Standard: Erstmal die Adresse oder ENS von RainbowKit nehmen
            let bestName = account.displayName; // RainbowKit liefert hier ENS oder 0x...

            // Dann versuchen wir, einen besseren Base-Namen zu finden
            resolveBaseName(account.address).then((resolved) => {
              if (resolved) {
                setDisplayName(resolved);
              } else {
                setDisplayName(bestName);
              }
            });
          }
        }, [connected, account]);

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              'style': {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="bg-white text-black font-bold py-2 px-4 rounded-xl hover:scale-105 transition-transform shadow-lg"
                  >
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="bg-red-500 text-white font-bold py-2 px-4 rounded-xl hover:bg-red-600 transition-colors shadow-lg"
                  >
                    Wrong network
                  </button>
                );
              }

              return (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={openChainModal}
                    style={{ display: 'flex', alignItems: 'center' }}
                    type="button"
                    className="bg-black/40 border border-white/10 text-white font-bold py-2 px-3 rounded-xl hover:bg-white/10 transition-colors hidden sm:flex items-center gap-2"
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 20,
                          height: 20,
                          borderRadius: 999,
                          overflow: 'hidden',
                          marginRight: 4,
                        }}
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            style={{ width: 20, height: 20 }}
                          />
                        )}
                      </div>
                    )}
                    {chain.name}
                  </button>

                  <button
                    onClick={openAccountModal} // Das ermöglicht das Ausloggen!
                    type="button"
                    className="bg-black/40 border border-white/10 text-white font-bold py-2 px-4 rounded-xl hover:bg-white/10 transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(22,82,240,0.3)]"
                  >
                    {/* Wallet Icon */}
                    <Wallet className="w-4 h-4 text-blue-500" />

                    {/* Der Name (BaseName > ENS > Adresse) */}
                    {displayName || account.displayName}

                    {/* Dropdown Icon */}
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};