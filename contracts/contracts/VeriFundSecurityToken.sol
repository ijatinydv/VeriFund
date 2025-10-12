// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title VeriFundSecurityToken
 * @dev A transfer-restricted ERC-721 NFT representing fractional ownership in VeriFund projects.
 * This contract implements a security token pattern where transfers are only permitted to
 * pre-approved whitelisted addresses, ensuring regulatory compliance (KYC/AML/DPDP Act).
 * 
 * Security Features:
 * - Whitelist-enforced transfers: Only whitelisted addresses can receive tokens
 * - Non-transferable by default: Prevents unauthorized secondary market trading
 * - Pausable operations: Emergency freeze capability for all minting and transfers
 * - Immutable legal agreement hash: On-chain reference to off-chain legal documentation
 * 
 * Each token represents a unique investor's share in a specific project, with the token URI
 * containing metadata about the investment terms, share percentage, and project details.
 */
contract VeriFundSecurityToken is ERC721, ERC721URIStorage, Ownable, Pausable {
    
    /**
     * @dev Mapping to track whitelisted investor addresses.
     * Only addresses with whitelist[address] == true can receive token transfers.
     * The zero address (burning) is always allowed regardless of whitelist status.
     */
    mapping(address => bool) public whitelist;
    
    /**
     * @dev Keccak256 hash of the off-chain legal agreement associated with this project.
     * This creates an immutable, verifiable link between the on-chain token and the
     * legal investment agreement stored off-chain (e.g., on IPFS or traditional storage).
     */
    bytes32 public agreementHash;
    
    /**
     * @dev Counter for generating unique token IDs.
     * Incremented with each mint to ensure sequential, collision-free token IDs.
     */
    uint256 private _nextTokenId;

    /**
     * @dev Emitted when an address is added to the whitelist.
     * @param account The address that was whitelisted
     */
    event AddedToWhitelist(address indexed account);
    
    /**
     * @dev Emitted when an address is removed from the whitelist.
     * @param account The address that was removed from the whitelist
     */
    event RemovedFromWhitelist(address indexed account);
    
    /**
     * @dev Emitted when a new security token is minted.
     * @param to The address receiving the token
     * @param tokenId The unique identifier of the minted token
     * @param uri The metadata URI associated with the token
     */
    event SecurityTokenMinted(address indexed to, uint256 indexed tokenId, string uri);

    /**
     * @dev Constructor initializes the security token with project-specific parameters.
     * 
     * @param initialOwner The address that will own and administer this contract (typically VeriFund backend)
     * @param _agreementHash The Keccak256 hash of the legal agreement governing this investment
     * @param name The human-readable name of the token collection (e.g., "VeriFund Project Alpha Shares")
     * @param symbol The ticker symbol for the token collection (e.g., "VFPA")
     */
    constructor(
        address initialOwner,
        bytes32 _agreementHash,
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) Ownable(initialOwner) {
        require(_agreementHash != bytes32(0), "VeriFundSecurityToken: agreement hash cannot be zero");
        agreementHash = _agreementHash;
    }

    /**
     * @dev Mints a new security token to an investor's address.
     * This function can only be called by the contract owner (VeriFund backend) and
     * requires that operations are not paused.
     * 
     * The recipient address must be whitelisted before minting, ensuring that only
     * KYC/AML-verified investors can receive tokens.
     * 
     * Requirements:
     * - Caller must be the contract owner
     * - Contract must not be paused
     * - Recipient address must be whitelisted
     * - URI must not be empty
     * 
     * @param to The whitelisted address that will receive the token
     * @param uri The metadata URI containing investment details (IPFS hash, HTTP URL, etc.)
     */
    function safeMint(address to, string memory uri) public onlyOwner whenNotPaused {
        require(whitelist[to], "VeriFundSecurityToken: recipient must be whitelisted");
        require(bytes(uri).length > 0, "VeriFundSecurityToken: URI cannot be empty");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        emit SecurityTokenMinted(to, tokenId, uri);
    }

    /**
     * @dev Adds an address to the whitelist, allowing them to receive security tokens.
     * This function should be called after an investor completes KYC/AML verification.
     * Only the contract owner can manage the whitelist.
     * 
     * Requirements:
     * - Caller must be the contract owner
     * - Address must not be the zero address
     * - Address must not already be whitelisted (to prevent redundant events)
     * 
     * @param _account The address to add to the whitelist
     */
    function addToWhitelist(address _account) public onlyOwner {
        require(_account != address(0), "VeriFundSecurityToken: cannot whitelist zero address");
        require(!whitelist[_account], "VeriFundSecurityToken: address already whitelisted");
        
        whitelist[_account] = true;
        emit AddedToWhitelist(_account);
    }

    /**
     * @dev Removes an address from the whitelist, preventing them from receiving tokens.
     * This function should be called if an investor's KYC/AML status is revoked or expires.
     * Removal from the whitelist does NOT affect tokens already held by the address.
     * Only the contract owner can manage the whitelist.
     * 
     * Requirements:
     * - Caller must be the contract owner
     * - Address must currently be whitelisted
     * 
     * @param _account The address to remove from the whitelist
     */
    function removeFromWhitelist(address _account) public onlyOwner {
        require(whitelist[_account], "VeriFundSecurityToken: address not whitelisted");
        
        whitelist[_account] = false;
        emit RemovedFromWhitelist(_account);
    }

    /**
     * @dev Batch adds multiple addresses to the whitelist.
     * Gas-efficient function for whitelisting multiple investors in a single transaction.
     * 
     * Requirements:
     * - Caller must be the contract owner
     * - Array must not be empty
     * - All addresses must be non-zero and not already whitelisted
     * 
     * @param _accounts Array of addresses to add to the whitelist
     */
    function addBatchToWhitelist(address[] memory _accounts) public onlyOwner {
        require(_accounts.length > 0, "VeriFundSecurityToken: empty array");
        
        for (uint256 i = 0; i < _accounts.length; i++) {
            address account = _accounts[i];
            require(account != address(0), "VeriFundSecurityToken: cannot whitelist zero address");
            
            if (!whitelist[account]) {
                whitelist[account] = true;
                emit AddedToWhitelist(account);
            }
        }
    }

    /**
     * @dev Internal function to enforce transfer restrictions.
     * This function overrides the ERC721 _update function, which is the modern and secure
     * way to implement transfer logic in OpenZeppelin v5.x (replacing _beforeTokenTransfer).
     * 
     * Transfer Rules:
     * 1. Minting (from == address(0)): Allowed if recipient is whitelisted
     * 2. Burning (to == address(0)): Always allowed
     * 3. Regular transfers (from != 0, to != 0): Only allowed if recipient is whitelisted
     * 4. All operations: Must not be paused
     * 
     * This implements the security token pattern where tokens cannot be traded on
     * unregulated secondary markets, ensuring regulatory compliance.
     * 
     * Requirements:
     * - Contract must not be paused
     * - If recipient is not the zero address (not a burn), they must be whitelisted
     * 
     * @param to The address receiving the token (zero address for burns)
     * @param tokenId The ID of the token being transferred
     * @param auth The address authorized to perform the transfer
     * @return The address that previously owned the token (for tracking purposes)
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721)
        whenNotPaused
        returns (address)
    {
        // Enforce whitelist restriction: burning is always allowed, but transfers require whitelist
        if (to != address(0)) {
            require(
                whitelist[to],
                "VeriFundSecurityToken: recipient must be whitelisted for transfers"
            );
        }
        
        // Call parent implementation to complete the transfer
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Returns the token URI containing metadata for a specific token.
     * This function resolves inheritance conflicts between ERC721 and ERC721URIStorage.
     * 
     * @param tokenId The ID of the token to query
     * @return The metadata URI string (typically an IPFS hash or HTTP URL)
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Returns whether this contract implements a given interface.
     * Required override for ERC165 interface detection with multiple inheritance.
     * 
     * @param interfaceId The interface identifier to check
     * @return True if the contract implements the specified interface
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Returns the total number of tokens minted so far.
     * Useful for tracking the total supply of security tokens in circulation.
     * 
     * @return The total number of minted tokens
     */
    function totalMinted() public view returns (uint256) {
        return _nextTokenId;
    }

    /**
     * @dev Checks if an address is whitelisted.
     * Convenience function for off-chain applications to verify whitelist status.
     * 
     * @param _account The address to check
     * @return True if the address is whitelisted, false otherwise
     */
    function isWhitelisted(address _account) public view returns (bool) {
        return whitelist[_account];
    }

    /**
     * @dev Emergency pause function. Only callable by owner.
     * Freezes all token minting and transfers until unpaused.
     * Use this in case of security incidents, regulatory requirements, or system upgrades.
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause function. Only callable by owner.
     * Resumes normal contract operations after a pause.
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
