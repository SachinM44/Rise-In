import React, { useState, useEffect } from 'react';
import { getTicketDetails, buyTicket } from '../utils/web3';

const TicketDetails = ({ ticketId }) => {
  const [ticket, setTicket] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchTicketDetails = async () => {
      const data = await getTicketDetails(ticketId);
      setTicket(data);
    };

    fetchTicketDetails();
  }, [ticketId]);

  const handleBuy = async () => {
    try {
      const res = await buyTicket(ticketId, ticket.price);
      setMessage(res ? 'Ticket successfully bought!' : 'Error occurred during the purchase.');
    } catch (err) {
      console.error(err);
      setMessage('Error occurred during the purchase.');
    }
  };

  return (
    <div>
      {ticket ? (
        <>
          <h2>Ticket Details</h2>
          <p>Event: {ticket.event}</p>
          <p>Price: {ticket.price} ETH</p>
          <button onClick={handleBuy}>Buy Ticket</button>
          <p>{message}</p>
        </>
      ) : (
        <p>Loading ticket details...</p>
      )}
    </div>
  );
};

export default TicketDetails;
