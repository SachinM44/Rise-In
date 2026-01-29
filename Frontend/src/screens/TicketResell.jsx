import React, { useState } from 'react';
import { listTicketForSale } from '../utils/web3'; // Function to interact with the contract

const TicketResell = ({ ticketId }) => {
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');

  const handleResell = async () => {
    if (!price || isNaN(price)) {
      setMessage('Please enter a valid price');
      return;
    }

    try {
      const res = await listTicketForSale(ticketId, price);
      setMessage(res ? 'Ticket successfully listed for resale!' : 'Error occurred during the resell process.');
    } catch (err) {
      console.error(err);
      setMessage('Error occurred during the resell process.');
    }
  };

  return (
    <div>
      <input 
        type="text" 
        placeholder="Enter price in ETH" 
        value={price} 
        onChange={(e) => setPrice(e.target.value)} 
      />
      <button onClick={handleResell}>List Ticket for Resale</button>
      <p>{message}</p>
    </div>
  );
};

export default TicketResell;
