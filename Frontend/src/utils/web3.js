import { ethers } from 'ethers';

// Set up the contract ABI and address
const contractAddress = '<your_contract_address>';
const abi = [
  "function listForSale(uint256 tokenId, uint256 price) public",
  "function buyTicket(uint256 tokenId) public payable",
  "function getUserTickets() public view returns (Ticket[] memory)",
  "function getTicketDetails(uint256 tokenId) public view returns (Ticket memory)"
];

// Check if Keplr Wallet is available
export const checkKeplrAvailability = () => {
  if (window.getOfflineSigner) {
    console.log('Keplr Wallet detected!');
    connectKeplrWallet();
  } else {
    alert('Keplr Wallet is not installed. Please install Keplr Wallet to proceed.');
  }
};

// Connect Keplr Wallet
const connectKeplrWallet = async () => {
  try {
    // Request user to connect Keplr wallet to TON blockchain
    await window.getOfflineSigner().enable('ton');  // Enable TON network for Keplr
    console.log('Keplr Wallet connected!');
  } catch (error) {
    console.error('Error connecting Keplr wallet:', error);
  }
};

// Initialize provider and contract
const provider = new ethers.providers.Web3Provider(window.ethereum); // Update this for Keplr wallet interaction
const signer = provider.getSigner();
const contract = new ethers.Contract(contractAddress, abi, signer);

// Function to list a ticket for sale
export const listTicketForSale = async (ticketId, price) => {
  try {
    const priceInWei = ethers.utils.parseEther(price);
    const tx = await contract.listForSale(ticketId, priceInWei);
    await tx.wait();
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

// Function to fetch user tickets
export const getUserTickets = async () => {
  try {
    const tickets = await contract.getUserTickets();
    return tickets.map(ticket => ({
      id: ticket.id.toString(),
      price: ethers.utils.formatEther(ticket.price)
    }));
  } catch (err) {
    console.error(err);
    return [];
  }
};

// Function to buy a ticket
export const buyTicket = async (ticketId, price) => {
  try {
    const priceInWei = ethers.utils.parseEther(price);
    const tx = await contract.buyTicket(ticketId, { value: priceInWei });
    await tx.wait();
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

// Function to get ticket details
export const getTicketDetails = async (ticketId) => {
  try {
    const ticket = await contract.getTicketDetails(ticketId);
    return {
      id: ticket.id.toString(),
      event: ticket.event,
      price: ethers.utils.formatEther(ticket.price)
    };
  } catch (err) {
    console.error(err);
    return null;
  }
};
