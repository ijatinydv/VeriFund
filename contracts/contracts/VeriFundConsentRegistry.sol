// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VeriFundConsentRegistry
 * @dev A secure, on-chain consent registry for the VeriFund platform.
 * This contract creates an immutable audit trail of user consents to ensure
 * compliance with regulations such as India's DPDP Act, 2023.
 * 
 * The contract uses an event-driven architecture for gas efficiency, storing
 * consent records as indexed events rather than in contract storage.
 * Only the contract owner (typically the VeriFund backend server) can log consents.
 */
contract VeriFundConsentRegistry is Ownable {
    
    /**
     * @dev Emitted when a user consent is logged on-chain.
     * This event serves as the primary audit trail for regulatory compliance.
     * 
     * @param user The Ethereum address of the user providing consent (indexed for filtering)
     * @param consentType A unique identifier for the type of consent (e.g., "TERMS_V1", "KYC_CONSENT")
     * @param documentHash The Keccak256 hash of the document or action being consented to
     * @param timestamp The block timestamp when the consent was recorded
     */
    event ConsentLogged(
        address indexed user,
        bytes32 indexed consentType,
        bytes32 documentHash,
        uint256 timestamp
    );

    /**
     * @dev Constructor sets the deployer as the initial owner.
     * In OpenZeppelin v5.x, the Ownable constructor requires an explicit initial owner.
     * 
     * @param initialOwner The address that will own and administer this contract
     */
    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Logs a user consent event on-chain.
     * This function can only be called by the contract owner (backend server).
     * It emits a ConsentLogged event containing all consent details, creating
     * a permanent, tamper-proof record on the blockchain.
     * 
     * Gas Optimization: By using events instead of storage, this function
     * minimizes gas costs while maintaining full auditability.
     * 
     * @param _user The address of the user providing consent
     * @param _consentType A bytes32 identifier representing the consent category
     * @param _documentHash The Keccak256 hash of the consented document or action
     */
    function logConsent(
        address _user,
        bytes32 _consentType,
        bytes32 _documentHash
    ) public onlyOwner {
        emit ConsentLogged(
            _user,
            _consentType,
            _documentHash,
            block.timestamp
        );
    }
}
