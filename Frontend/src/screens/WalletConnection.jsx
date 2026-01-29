import React, { useState } from 'react';

const WalletConnection = () => {
  const [walletAddress, setWalletAddress] = useState('');

  const connectWallet = async () => {
    if (window.keplr) {
      try {
        await window.keplr.enable("agoric");
        const address = await window.getAddress();
        setWalletAddress(address);
      } catch (err) {
        console.error(err);
        alert('Error connecting to Keplr wallet');
      }
    } else {
      alert('Keplr wallet is not installed');
    }
  };

  return (
    <div>
      <button onClick={connectWallet}>Connect Wallet</button>
      {walletAddress && <p>Connected to: {walletAddress}</p>}
    </div>
  );
};

export default WalletConnection;
