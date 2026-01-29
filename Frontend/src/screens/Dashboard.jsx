import React, { useEffect, useState } from 'react';
import { getUserTickets } from '../web.js';  // Import the getUserTickets function from web.js

const Dashboard = () => {
  const [tickets, setTickets] = useState([]);

  // Fetch user tickets when the component mounts
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const userTickets = await getUserTickets();  // Fetch tickets after connecting to Keplr
        setTickets(userTickets);
      } catch (error) {
        console.error('Error fetching user tickets:', error);
      }
    };

    fetchTickets();
  }, []);

  return (
    <div>
      <h2>Your Tickets</h2>
      <ul>
        {tickets.length > 0 ? (
          tickets.map(ticket => (
            <li key={ticket.id}>
              Ticket ID: {ticket.id}, Price: {ticket.price} TON
            </li>
          ))
        ) : (
          <li>No tickets found</li>
        )}
      </ul>
    </div>
  );
};

export default Dashboard;
