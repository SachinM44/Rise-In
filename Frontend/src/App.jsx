import React, { useEffect } from 'react';
import { checkKeplrAvailability } from './utils/web3';  // Import the check function from web.js

const App = () => {
  useEffect(() => {
    // Check if Keplr is available when the app loads
    checkKeplrAvailability();
  }, []);

  return (
    <div>
      <h1>Welcome to the TON Ticketing App</h1>
      {/* Other app components here */}
    </div>
  );
};

export default App;
