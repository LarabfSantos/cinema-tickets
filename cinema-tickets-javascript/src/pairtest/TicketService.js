import TicketTypeRequest from './lib/TicketTypeRequest.js';
import InvalidPurchaseException from './lib/InvalidPurchaseException.js';
import SeatReservationService from '../thirdparty/seatbooking/SeatReservationService.js';
import TicketPaymentService from '../thirdparty/paymentgateway/TicketPaymentService.js';

export default class TicketService {
  constructor() {
    this.ticketPrices = {
      INFANT: 0,
      CHILD: 10,
      ADULT: 20,
    };
  }

  purchaseTickets(accountId, ...ticketTypeRequests) {
    let adultCount = 0;
    let childCount = 0;
    let infantCount = 0;

    for (const request of ticketTypeRequests) {
      const type = request.getTicketType();
      const quantity = request.getNoOfTickets();

      if (type === 'ADULT') {
        adultCount += quantity;
      } else if (type === 'CHILD') {
        childCount += quantity;
      } else if (type === 'INFANT') {
        infantCount += quantity;
      }

      if (adultCount + childCount + infantCount > 20) {
        return "Total quantity cannot exceed 20 tickets"
      }

      // Child and Infant tickets cannot be purchased without purchasing an Adult ticket.
      if ((childCount + infantCount > 0) && adultCount === 0) {
        return "Child and Infant ticket cannot be purchased without an Adult ticket"
      }

      // throws InvalidPurchaseException
      if (!this.isValidTicketType(request) || !this.isValidQuantity(request)) {
        return "Invalid purchase request";
      }

      if (!this.hasSufficientFunds(accountId, request)) {
        return "Insufficient funds";
      }

      // Make the payment request to TicketPaymentService
      const totalCost = this.calculateTotalCost(type, quantity);
      const paymentResult = TicketPaymentService.processPayment(totalCost);

      // Make payment request to TicketPaymentService and use 'try' statement to handle exceptions that are thrown
      try {
        TicketPaymentService.makePayment(accountId, totalCost);
      } catch (error) {
        throw new InvalidPurchaseException("This payment is not valid.");
      }

      if (paymentResult === "Payment successful") {
        // Handle seat reservation
        try {
          SeatReservationService.reserveSeat(accountId, quantity);
        } catch (error) {
          if (error instanceof TypeError) {
            throw new InvalidPurchaseException("Seat Reservation failed.");;
          } else {
            // To handle other types of errors if necessary
            return "Seat reservation failed with an unexpected error";
          }
        }
      } else {
        return "Payment failed";
      }
    }
  }

  isValidTicketType(ticketRequest) {
    const validTypes = ticketRequest.getTicketType();
    return validTypes === 'ADULT' || validTypes === 'CHILD' || validTypes === 'INFANT';
  }

  isValidQuantity(ticketRequest) {
    const quantity = ticketRequest.getNoOfTickets();
    return Number.isInteger(quantity) && quantity > 0 && quantity <= 20;
  }

  hasSufficientFunds(accountId, ticketRequest) {
    // Assuming that all accounts with an ID greater than zero are valid
    const accountBalance = getAccountBalance(accountId);
    const ticketType = ticketRequest.getTicketType();
    const quantity = ticketRequest.getNoOfTickets();
    const ticketPrice = this.ticketPrices[ticketType.toUpperCase()];
    const totalCost = ticketPrice * quantity;

    return accountBalance >= totalCost;
  }
}
