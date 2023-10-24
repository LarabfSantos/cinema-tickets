import assert from 'assert';
import TicketService from '../TicketService';
import TicketTypeRequest from './lib/TicketTypeRequest';

describe('TicketService', () => {
    it('should succsefully purchase a single ADULT ticket', () => {
        const ticketService = new TicketService();
        const accountId = 110;
        const ticketRequest = new TicketTypeRequest('ADULT', 1);
        const purchaseResult = ticketService.purchaseTickets(accountId, ticketRequest);

        assert.equal(purchaseResult, 3)
    });
});


// Test TicketService.js class
// simulate various purchase scenarios, including valid and invalid requests

// it should calculate the total cost correctly
// should handle seat reservation
// should reject invalid ticket purchase requests
// test when the payment fails
// attempt to purchase child or infants without an adult ticket
