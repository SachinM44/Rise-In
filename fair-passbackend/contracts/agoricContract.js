// Define the inventory and MRP for tickets
const inventory = {
    frontRow: {
      tradePrice: AmountMath.make(istBrand, 3n), // MRP for front row tickets
      maxTickets: 3n
    },
    middleRow: {
      tradePrice: AmountMath.make(istBrand, 2n), // MRP for middle row tickets
      maxTickets: 5n
    },
    backRow: {
      tradePrice: AmountMath.make(istBrand, 1n), // MRP for back row tickets
      maxTickets: 10n
    }
  };
  
  const ticketMint = await zcf.makeZCFMint('Ticket', AssetKind.COPY_BAG);
  const { brand: ticketBrand } = ticketMint.getIssuerRecord();
  
  const inventoryBag = makeCopyBag(
    Object.entries(inventory).map(([ticket, { maxTickets }], _i) => [
      ticket,
      maxTickets
    ])
  );
  
  const toMint = {
    Tickets: {
      brand: ticketBrand,
      value: inventoryBag
    }
  };
  
  const inventorySeat = ticketMint.mintGains(toMint);
  
  // Track ticket sales
  let ticketsSold = {
    frontRow: 0n,
    middleRow: 0n,
    backRow: 0n
  };
  
  // TimerService to track the 12-minute wait time
  let timerService; // Assuming TimerService is available and passed to the contract
  
  // Variable to track if reselling is enabled
  let resellingEnabled = false;
  let saleCompleteTimestamp = null;
  
  // Function to check if all tickets are sold at MRP
  function allTicketsSoldAtMRP() {
    return (
      ticketsSold.frontRow === inventory.frontRow.maxTickets &&
      ticketsSold.middleRow === inventory.middleRow.maxTickets &&
      ticketsSold.backRow === inventory.backRow.maxTickets
    );
  }
  
  // Function to start the 12-minute timer after all tickets are sold at MRP
  function startResellTimer() {
    // Get the current timestamp
    const currentTimestamp = timerService.getClock().getCurrentTimestamp();
    
    // Set a 12-minute delay (720000n ms = 12 minutes)
    const delay = 720000n; // 12 minutes in ms (represented in BigInt)
    
    // Set the timer to enable reselling after 12 minutes
    timerService.delay(delay).then(() => {
      resellingEnabled = true;
      console.log('12 minutes passed. Reselling is now enabled.');
    });
    
    // Store the timestamp when all tickets are sold
    saleCompleteTimestamp = currentTimestamp;
  }
  
  // Function to handle ticket trade (buy tickets)
  const makeTradeInvitation = () =>
    zcf.makeInvitation(tradeHandler, 'buy tickets', undefined, proposalShape);
  
  const proposalShape = harden({
    give: { Price: AmountShape },
    want: { Tickets: { brand: ticketBrand, value: M.bag() } },
    exit: M.any()
  });
  
  const tradeHandler = (buyerSeat) => {
    const { give, want } = buyerSeat.getProposal();
  
    // Check if enough tickets are available
    AmountMath.isGTE(inventorySeat.getCurrentAllocation().Tickets, want.Tickets) ||
      Fail`Not enough inventory, ${q(want.Tickets)} wanted`;
  
    // Calculate total price for tickets
    const totalPrice = bagPrice(want.Tickets.value, inventory);
  
    // Ensure buyer offers sufficient price
    AmountMath.isGTE(give.Price, totalPrice) ||
      Fail`Total price is ${q(totalPrice)}, but ${q(give.Price)} was given`;
  
    // Execute the trade (payment and ticket transfer)
    atomicRearrange(
      zcf,
      harden([
        [buyerSeat, proceeds, { Price: totalPrice }],
        [inventorySeat, buyerSeat, want]
      ])
    );
  
    // Update ticket sales tracking after a successful purchase
    want.Tickets.value.entries().forEach(([ticketType, quantity]) => {
      ticketsSold[ticketType] = AmountMath.add(
        ticketsSold[ticketType],
        quantity
      );
    });
  
    // If all tickets are sold at MRP, start the 12-minute timer
    if (allTicketsSoldAtMRP() && !saleCompleteTimestamp) {
      startResellTimer();
    }
  };
  
  // Function to handle reselling tickets
  const makeResaleInvitation = () =>
    zcf.makeInvitation(resaleHandler, 'resell ticket', undefined, resaleProposalShape);
  
  const resaleProposalShape = harden({
    give: { Tickets: { brand: ticketBrand, value: M.bag() } },
    want: { Price: AmountShape },
    exit: M.any(),
  });
  
  const resaleHandler = (sellerSeat) => {
    const { give, want } = sellerSeat.getProposal();
  
    // Ensure the seller owns the tickets they're trying to resell
    AmountMath.isGTE(
      sellerSeat.getCurrentAllocation().Tickets,
      give.Tickets
    ) || Fail`You don't own the tickets you're trying to sell`;
  
    // Check if all tickets have been sold at MRP and wait for the 12-minute timer to expire
    if (!allTicketsSoldAtMRP()) {
      Fail`Tickets can only be resold after all tickets have been sold at the MRP`;
    }
  
    // Ensure reselling is only allowed after the 12-minute wait time
    if (!resellingEnabled) {
      Fail`Reselling is not allowed yet. Please wait for 12 minutes after tickets are sold out.`;
    }
  
    // Execute the resell transaction (payment and ticket transfer between seller and buyer)
    const buyerInvitation = zcf.makeInvitation((buyerSeat) => {
      const buyerProposal = buyerSeat.getProposal();
  
      // Ensure buyer offers sufficient price for resale
      AmountMath.isGTE(
        buyerProposal.give.Price,
        want.Price
      ) || Fail`Price offered by buyer is insufficient`;
  
      // Execute the atomic transaction for reselling
      atomicRearrange(
        zcf,
        harden([
          [buyerSeat, sellerSeat, { Price: buyerProposal.give.Price }],
          [sellerSeat, buyerSeat, { Tickets: give.Tickets }],
        ])
      );
      buyerSeat.exit();
    }, 'buy resale ticket');
  
    return harden({
      buyerInvitation,
    });
  };
  
  // Utility function to calculate the total price for a bag of tickets
  function bagPrice(ticketBag, inventory) {
    let totalPrice = AmountMath.make(istBrand, 0n);
    ticketBag.entries().forEach(([ticketType, quantity]) => {
      const ticketInfo = inventory[ticketType];
      totalPrice = AmountMath.add(
        totalPrice,
        AmountMath.multiply(ticketInfo.tradePrice, quantity)
      );
    });
    return totalPrice;
  }
  