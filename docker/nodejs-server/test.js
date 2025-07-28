ass BankService {
    constructor(name, initialBalance) {
        this.name = name;
        this.balance = initialBalance;
        this.preparedTransactions = {}; // Stores transactions in 'prepared' state
        this.log = []; // Simple transaction log for durability

        console.log(`[${this.name}] Initializing with balance: ${this.balance}`);
    }

    _simulateDbWrite(transactionId, state) {
        this.log.push(`[${this.name}] ${transactionId}: ${state}`);
        // In real-world, this would be a durable write to a transaction log or DB
    }

    // Phase 1: Prepare
    async prepareTransaction(transactionId, amount, type) {
        console.log(`\n[${this.name}] --- PREPARE: ${transactionId} (Type: ${type}, Amount: ${amount}) ---`);
        let canPrepare = true;

        if (type === 'debit') {
            if (this.balance >= amount) {
                // Simulate locking resources and writing to a durable log
                this.preparedTransactions[transactionId] = { amount, type };
                this._simulateDbWrite(transactionId, 'PREPARED_DEBIT');
                console.log(`[${this.name}] Prepared to debit ${amount}. Current balance: ${this.balance}`);
            } else {
                console.error(`[${this.name}] Insufficient funds (${this.balance}) for debit of ${amount}.`);
                canPrepare = false; // VOTE_ABORT
            }
        } else if (type === 'credit') {
            // Simulate locking resources and writing to a durable log
            this.preparedTransactions[transactionId] = { amount, type };
            this._simulateDbWrite(transactionId, 'PREPARED_CREDIT');
            console.log(`[${this.name}] Prepared to credit ${amount}. Current balance: ${this.balance}`);
        } else {
            console.error(`[${this.name}] Invalid transaction type: ${type}`);
            canPrepare = false;
        }

        // Simulate network delay for synchronous response
        await new Promise(resolve => setTimeout(resolve, 50));
        return canPrepare; // Returns VOTE_COMMIT or VOTE_ABORT
    }

    // Phase 2: Commit
    async commitTransaction(transactionId) {
        console.log(`\n[${this.name}] --- COMMIT: ${transactionId} ---`);
        if (this.preparedTransactions[transactionId]) {
            const txData = this.preparedTransactions[transactionId];
            if (txData.type === 'debit') {
                this.balance -= txData.amount;
            } else if (txData.type === 'credit') {
                this.balance += txData.amount;
            }
            delete this.preparedTransactions[transactionId]; // Release resources/locks
            this._simulateDbWrite(transactionId, 'COMMITTED');
            console.log(`[${this.name}] Transaction ${transactionId} committed. New balance: ${this.balance}`);
            return true;
        }
        console.error(`[${this.name}] Error: Transaction ${transactionId} not prepared for commit.`);
        return false;
    }

    // Phase 2: Abort
    async abortTransaction(transactionId) {
        console.log(`\n[${this.name}] --- ABORT: ${transactionId} ---`);
        if (this.preparedTransactions[transactionId]) {
            delete this.preparedTransactions[transactionId]; // Release resources/locks
            this._simulateDbWrite(transactionId, 'ABORTED');
            console.log(`[${this.name}] Transaction ${transactionId} aborted. Resources released.`);
            return true;
        }
        console.log(`[${this.name}] Transaction ${transactionId} was not in prepared state.`);
        return false;
    }

    getBalance() {
        return this.balance;
    }
}

// --- Coordinator Side ---

class TwoPhaseCommitCoordinator {
    constructor(participants) {
        this.participants = participants; // Array of BankService instances
    }

    async initiateDistributedTransaction(transactionId, debitorService, debitorAmount, creditorService, creditorAmount) {
        console.log(`\n### [Coordinator] Initiating distributed transaction: ${transactionId} ###`);
        let allPrepared = true;
        const preparePromises = [];

        // Phase 1: Prepare (Request to Commit / Voting Phase)
        console("[Coordinator] --- Phase 1: Prepare ---");

        // Send prepare calls to all participants.
        // In real 2PC, these would block until response, here we use Promise.all to simulate waiting for all.
        preparePromises.push(debitorService.prepareTransaction(transactionId, debitorAmount, 'debit'));
        preparePromises.push(creditorService.prepareTransaction(transactionId, creditorAmount, 'credit'));

        const votes = await Promise.all(preparePromises);

        // Check all votes
        for (const vote of votes) {
            if (!vote) {
                allPrepared = false;
                break;
            }
        }

        // Phase 2: Commit / Abort (Decision Phase)
        console("\n[Coordinator] --- Phase 2: Decision ---");
        const decisionPromises = [];

        if (allPrepared) {
            console(`[Coordinator] All participants prepared for ${transactionId}. Sending COMMIT.`);
            // Send commit to all participants
            decisionPromises.push(debitorService.commitTransaction(transactionId));
            decisionPromises.push(creditorService.commitTransaction(transactionId));
        } else {
            console(`[Coordinator] Not all participants prepared for ${transactionId}. Sending ABORT.`);
            // Send abort to all participants
            decisionPromises.push(debitorService.abortTransaction(transactionId));
            decisionPromises.push(creditorService.abortTransaction(transactionId));
        }

        // Wait for all participants to acknowledge the final decision
        await Promise.all(decisionPromises);
        console(`\n### [Coordinator] Transaction ${transactionId} completed. ###`);
    }
}

// --- Simulation ---
async function run2PCExample() {
    const bankA = new BankService("Bank A", 1000);
    const bankB = new BankService("Bank B", 500);

    const coordinator = new TwoPhaseCommitCoordinator([bankA, bankB]);

    // Scenario 1: Successful Transfer
    console("\n--- Scenario 1: Successful Transfer (A -> B, 200) ---");
    await coordinator.initiateDistributedTransaction("TXN001", bankA, 200, bankB, 200);
    console(`\nFinal Balance Bank A: ${bankA.getBalance()}`);
    console(`Final Balance Bank B: ${bankB.getBalance()}`);

    // Scenario 2: Failed Transfer (Insufficient Funds in A)
    console("\n--- Scenario 2: Failed Transfer (A -> B, 900 - Insufficient Funds) ---");
    await coordinator.initiateDistributedTransaction("TXN002", bankA, 900, bankB, 900); // Bank A only has 800 left
    console(`\nFinal Balance Bank A: ${bankA.getBalance()}`);
    console(`Final Balance Bank B: ${bankB.getBalance()}`);

    // Scenario 3: Another Successful Transfer
    console("\n--- Scenario 3: Successful Transfer (B -> A, 100) ---");
    await coordinator.initiateDistributedTransaction("TXN003", bankB, 100, bankA, 100);
    console(`\nFinal Balance Bank A: ${bankA.getBalance()}`);
    console(`Final Balance Bank B: ${bankB.getBalance()}`);
}



run2PCExample() 


// --- Participant Services ---

class PaymentService {
    constructor() {
        this.transactions = {}; // Simulates a database for payments
    }

    async processPayment(orderId, amount) {
        console(`[PaymentService] Processing payment for Order ${orderId}, Amount: ${amount}`);
        // Simulate a successful payment
        this.transactions[orderId] = { status: 'completed', amount: amount };
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulate work
        console(`[PaymentService] Payment for Order ${orderId} successful.`);
        return { success: true };
    }

    async refundPayment(orderId) {
        console(`[PaymentService] Refunding payment for Order ${orderId}`);
        // Simulate refund logic
        if (this.transactions[orderId]) {
            this.transactions[orderId].status = 'refunded';
            await new Promise(resolve => setTimeout(resolve, 50)); // Simulate work
            console(`[PaymentService] Payment for Order ${orderId} refunded.`);
            return { success: true };
        }
        console.error(`[PaymentService] No payment found for Order ${orderId} to refund.`);
        return { success: false };
    }
}

class InventoryService {
    constructor() {
        this.stock = { 'item_A': 100, 'item_B': 50 }; // Simulates inventory
        this.reservedItems = {}; // Items reserved for an order
    }

    async reserveItems(orderId, items) {
        console(`[InventoryService] Attempting to reserve items for Order ${orderId}:`, items);
        let allAvailable = true;
        const currentReservation = {};

        for (const item of items) {
            if (this.stock[item.id] && this.stock[item.id] >= item.quantity) {
                currentReservation[item.id] = item.quantity;
            } else {
                console.error(`[InventoryService] Item ${item.id} not enough stock or not found.`);
                allAvailable = false;
                break;
            }
        }

        if (allAvailable) {
            // Simulate reserving items (deduct from stock temporarily)
            for (const item of items) {
                this.stock[item.id] -= item.quantity;
            }
            this.reservedItems[orderId] = currentReservation;
            await new Promise(resolve => setTimeout(resolve, 50)); // Simulate work
            console(`[InventoryService] Items for Order ${orderId} reserved successfully.`);
            return { success: true };
        } else {
            console.error(`[InventoryService] Failed to reserve items for Order ${orderId}.`);
            return { success: false, reason: "Insufficient stock" };
        }
    }

    async releaseItems(orderId) {
        console(`[InventoryService] Releasing items for Order ${orderId}`);
        if (this.reservedItems[orderId]) {
            const released = this.reservedItems[orderId];
            for (const itemId in released) {
                this.stock[itemId] += released[itemId]; // Add back to stock
            }
            delete this.reservedItems[orderId];
            await new Promise(resolve => setTimeout(resolve, 50)); // Simulate work
            console(`[InventoryService] Items for Order ${orderId} released.`);
            return { success: true };
        }
        console.error(`[InventoryService] No reserved items found for Order ${orderId} to release.`);
        return { success: false };
    }
}

// --- Orchestrator Service ---

class SagaOrchestrator {
    constructor(paymentService, inventoryService) {
        this.paymentService = paymentService;
        this.inventoryService = inventoryService;
    }

    async createOrderSaga(orderId, amount, items) {
        console(`\n### [Orchestrator] Starting Saga for Order ${orderId} ###`);
        let sagaState = { orderId, amount, items, status: 'started' };

        try {
            // Step 1: Process Payment
            console("\n[Orchestrator] Step 1: Requesting Payment...");
            const paymentResult = await this.paymentService.processPayment(orderId, amount);
            if (!paymentResult.success) {
                sagaState.status = 'payment_failed';
                throw new Error("Payment failed.");
            }
            sagaState.status = 'payment_completed';

            // Step 2: Reserve Inventory
            console("\n[Orchestrator] Step 2: Requesting Inventory Reservation...");
            const inventoryResult = await this.inventoryService.reserveItems(orderId, items);
            if (!inventoryResult.success) {
                sagaState.status = 'inventory_reservation_failed';
                throw new Error("Inventory reservation failed.");
            }
            sagaState.status = 'inventory_reserved';

            // If all steps succeed
            sagaState.status = 'completed';
            console(`\n### [Orchestrator] Saga for Order ${orderId} COMPLETED successfully! ###`);
            return { success: true, sagaState };

        } catch (error) {
            console(`\n### [Orchestrator] Saga for Order ${orderId} FAILED: ${error.message} ###`);
            sagaState.status = 'failed';
            // Trigger Compensating Transactions
            console("\n[Orchestrator] Triggering Compensating Transactions...");

            if (sagaState.status === 'inventory_reservation_failed' || sagaState.status === 'inventory_reserved') {
                // If inventory was reserved, release it
                await this.inventoryService.releaseItems(orderId);
            }
            if (sagaState.status === 'inventory_reservation_failed' || sagaState.status === 'inventory_reserved' || sagaState.status === 'payment_completed') {
                // If payment was processed, refund it
                await this.paymentService.refundPayment(orderId);
            }

            console(`\n### [Orchestrator] Saga for Order ${orderId} ABORTED with compensations. ###`);
            return { success: false, sagaState, error: error.message };
        }
    }
}

// --- Simulation (Orchestration) ---
async function runOrchestrationSagaExample() {
    const payment = new PaymentService();
    const inventory = new InventoryService();
    const orchestrator = new SagaOrchestrator(payment, inventory);

    // Scenario 1: Successful Order
    console("\n--- Scenario 1: Successful Order ---");
    await orchestrator.createOrderSaga("ORDER001", 150, [{ id: 'item_A', quantity: 1 }]);
    console(`\nInventory Stock: ${JSON.stringify(inventory.stock)}`);

    // Scenario 2: Order Fails at Inventory (e.g., item_C doesn't exist)
    console("\n\n--- Scenario 2: Order Fails at Inventory (item_C not found) ---");
    await orchestrator.createOrderSaga("ORDER002", 200, [{ id: 'item_C', quantity: 2 }]);
    console(`\nInventory Stock: ${JSON.stringify(inventory.stock)}`); // Stock of item_A should be back to original if payment occurred
}

runOrchestrationSagaExample();
