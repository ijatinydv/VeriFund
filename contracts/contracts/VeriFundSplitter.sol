// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VeriFundSplitter
 * @dev A secure payment splitter contract for distributing ETH revenue to investors
 * with a predefined repayment cap. This contract implements the pull-over-push pattern
 * for withdrawals and follows the Checks-Effects-Interactions security pattern.
 * 
 * Security Features:
 * - Pull-over-push withdrawal pattern prevents forced transactions
 * - Checks-Effects-Interactions prevents reentrancy attacks
 * - ReentrancyGuard provides additional reentrancy protection
 * - Pausable allows emergency freezing of all operations
 * - Ownable restricts administrative functions
 * 
 * Each investor has a proportional share of revenue up to the repayment cap.
 * Once the cap is reached, no further distributions can occur.
 */
contract VeriFundSplitter is Ownable, Pausable, ReentrancyGuard {
    
    /**
     * @dev Maximum total amount of ETH (in wei) that can be distributed to all investors.
     * Once totalReleased reaches this value, the contract stops distributing funds.
     */
    uint256 public repaymentCap;
    
    /**
     * @dev Total amount of ETH (in wei) that has been withdrawn by all investors so far.
     * This value is compared against repaymentCap to enforce the distribution limit.
     */
    uint256 public totalReleased;
    
    /**
     * @dev Mapping from investor address to their proportional share.
     * Shares are expressed in basis points (e.g., 500 = 5%, 10000 = 100%).
     */
    mapping(address => uint256) public shares;
    
    /**
     * @dev The sum of all investor shares, used as the denominator for share calculations.
     * Typically set to 10000 to represent 100% (basis points).
     */
    uint256 public totalShares;
    
    /**
     * @dev Mapping from investor address to the cumulative amount of ETH they have withdrawn.
     * Used to calculate how much additional ETH an investor is entitled to withdraw.
     */
    mapping(address => uint256) public released;
    
    /**
     * @dev Array of all investor addresses.
     * Allows enumeration of all payees for administrative purposes.
     */
    address payable[] public payees;
    
    /**
     * @dev Tracks whether the repayment cap has been reached to emit CapReached only once.
     */
    bool private capReachedEmitted;

    /**
     * @dev Emitted when the contract receives ETH.
     * @param from The address that sent ETH to the contract
     * @param amount The amount of ETH received (in wei)
     */
    event PaymentReceived(address from, uint256 amount);
    
    /**
     * @dev Emitted when an investor successfully withdraws their share of funds.
     * @param to The address of the investor receiving the payment
     * @param amount The amount of ETH withdrawn (in wei)
     */
    event PaymentReleased(address indexed to, uint256 amount);
    
    /**
     * @dev Emitted once when the total distributed amount reaches the repayment cap.
     * After this event, no further distributions can occur.
     * @param totalAmount The total amount distributed when the cap was reached
     */
    event CapReached(uint256 totalAmount);

    /**
     * @dev Constructor initializes the payment splitter with investors and their shares.
     * 
     * Requirements:
     * - _payees and _shares arrays must have the same non-zero length
     * - Each payee address must be non-zero
     * - Each share amount must be greater than zero
     * - _repaymentCap must be greater than zero
     * 
     * @param initialOwner The address that will own and administer this contract
     * @param _payees Array of investor addresses who will receive revenue shares
     * @param _shares Array of share amounts corresponding to each payee (in basis points)
     * @param _repaymentCap Maximum total ETH (in wei) that can be distributed
     */
    constructor(
        address initialOwner,
        address payable[] memory _payees,
        uint256[] memory _shares,
        uint256 _repaymentCap
    ) payable Ownable(initialOwner) {
        require(_payees.length > 0, "VeriFundSplitter: no payees");
        require(_payees.length == _shares.length, "VeriFundSplitter: payees and shares length mismatch");
        require(_repaymentCap > 0, "VeriFundSplitter: repayment cap must be greater than zero");

        for (uint256 i = 0; i < _payees.length; i++) {
            require(_payees[i] != address(0), "VeriFundSplitter: payee is zero address");
            require(_shares[i] > 0, "VeriFundSplitter: shares are zero");
            require(shares[_payees[i]] == 0, "VeriFundSplitter: duplicate payee");

            payees.push(_payees[i]);
            shares[_payees[i]] = _shares[i];
            totalShares += _shares[i];
        }

        repaymentCap = _repaymentCap;
    }

    /**
     * @dev Fallback function to receive ETH payments.
     * Emits PaymentReceived event for tracking purposes.
     * Can be paused in emergency situations.
     */
    receive() external payable whenNotPaused {
        emit PaymentReceived(msg.sender, msg.value);
    }

    /**
     * @dev Allows an investor to withdraw their proportional share of accumulated revenue.
     * This function implements the pull-over-push pattern for security.
     * 
     * Calculation Logic:
     * 1. Calculate total entitled amount = (contract balance + totalReleased) * investor's share / totalShares
     * 2. Calculate payment due = total entitled amount - amount already released to investor
     * 3. Clamp payment to not exceed remaining cap: min(payment, repaymentCap - totalReleased)
     * 
     * Security Pattern (Checks-Effects-Interactions):
     * 1. CHECKS: Validate share ownership and payment amount
     * 2. EFFECTS: Update state variables (released, totalReleased)
     * 3. INTERACTIONS: Transfer ETH to investor
     * 
     * Requirements:
     * - Account must have a non-zero share
     * - Calculated payment must be greater than zero
     * - Repayment cap must not have been reached
     * 
     * @param account The address of the investor withdrawing funds
     */
    function release(address payable account) public nonReentrant whenNotPaused {
        // CHECKS
        require(shares[account] > 0, "VeriFundSplitter: account has no shares");
        
        // Calculate the total amount this account is entitled to
        // based on the entire balance (received + unreleased)
        uint256 totalReceived = address(this).balance + totalReleased;
        uint256 payment = (totalReceived * shares[account]) / totalShares - released[account];
        
        require(payment > 0, "VeriFundSplitter: account is not due payment");
        
        // Check if distributing this payment would exceed the cap
        uint256 remainingCap = repaymentCap - totalReleased;
        require(remainingCap > 0, "VeriFundSplitter: repayment cap reached");
        
        // Clamp the payment to the remaining cap if necessary
        if (payment > remainingCap) {
            payment = remainingCap;
        }

        // EFFECTS: Update state variables before external call
        released[account] += payment;
        totalReleased += payment;
        
        bool capReached = (totalReleased >= repaymentCap);

        // INTERACTIONS: External call comes last
        (bool success, ) = account.call{value: payment}("");
        require(success, "VeriFundSplitter: transfer failed");

        emit PaymentReleased(account, payment);
        
        // Emit CapReached event only once
        if (capReached && !capReachedEmitted) {
            capReachedEmitted = true;
            emit CapReached(totalReleased);
        }
    }

    /**
     * @dev Returns the total number of payees/investors.
     * Useful for iterating through all payees off-chain.
     * @return The number of investor addresses
     */
    function payeesCount() public view returns (uint256) {
        return payees.length;
    }

    /**
     * @dev Returns the amount of ETH still available to be distributed before hitting the cap.
     * @return The remaining amount available for distribution (in wei)
     */
    function remainingCap() public view returns (uint256) {
        if (totalReleased >= repaymentCap) {
            return 0;
        }
        return repaymentCap - totalReleased;
    }

    /**
     * @dev Calculates the pending payment for a given account.
     * This is a view function that shows how much an investor can currently withdraw.
     * 
     * @param account The address to check pending payment for
     * @return The amount of ETH available for withdrawal (in wei), clamped to remaining cap
     */
    function pendingPayment(address account) public view returns (uint256) {
        if (shares[account] == 0) {
            return 0;
        }
        
        uint256 totalReceived = address(this).balance + totalReleased;
        uint256 payment = (totalReceived * shares[account]) / totalShares - released[account];
        
        uint256 remainingCapAmount = remainingCap();
        if (payment > remainingCapAmount) {
            payment = remainingCapAmount;
        }
        
        return payment;
    }

    /**
     * @dev Emergency pause function. Only callable by owner.
     * Freezes all payments and incoming transfers.
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause function. Only callable by owner.
     * Resumes normal contract operations.
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
