// test/SecurityToken.test.js
// Comprehensive test suite for VeriFundSecurityToken contract

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("VeriFundSecurityToken", function () {
  // ============================================================
  // Fixtures for test setup
  // ============================================================
  
  async function deploySecurityTokenFixture() {
    const [owner, investor1, investor2, investor3, unauthorizedUser] = await ethers.getSigners();

    const agreementHash = ethers.keccak256(ethers.toUtf8Bytes("Project Alpha Investment Agreement v1.0"));
    const tokenName = "VeriFund Project Alpha";
    const tokenSymbol = "VFPA";

    const SecurityToken = await ethers.getContractFactory("VeriFundSecurityToken");
    const securityToken = await SecurityToken.deploy(
      owner.address,
      agreementHash,
      tokenName,
      tokenSymbol
    );

    return { securityToken, owner, investor1, investor2, investor3, unauthorizedUser, agreementHash };
  }

  // ============================================================
  // Deployment Tests
  // ============================================================

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      const { securityToken, owner } = await loadFixture(deploySecurityTokenFixture);
      expect(await securityToken.owner()).to.equal(owner.address);
    });

    it("Should set the correct token name and symbol", async function () {
      const { securityToken } = await loadFixture(deploySecurityTokenFixture);
      expect(await securityToken.name()).to.equal("VeriFund Project Alpha");
      expect(await securityToken.symbol()).to.equal("VFPA");
    });

    it("Should store the agreement hash correctly", async function () {
      const { securityToken, agreementHash } = await loadFixture(deploySecurityTokenFixture);
      expect(await securityToken.agreementHash()).to.equal(agreementHash);
    });

    it("Should revert if agreement hash is zero", async function () {
      const [owner] = await ethers.getSigners();
      const SecurityToken = await ethers.getContractFactory("VeriFundSecurityToken");
      
      await expect(
        SecurityToken.deploy(owner.address, ethers.ZeroHash, "Test", "TEST")
      ).to.be.revertedWith("VeriFundSecurityToken: agreement hash cannot be zero");
    });

    it("Should start with zero total minted tokens", async function () {
      const { securityToken } = await loadFixture(deploySecurityTokenFixture);
      expect(await securityToken.totalMinted()).to.equal(0);
    });
  });

  // ============================================================
  // Whitelist Management Tests
  // ============================================================

  describe("Whitelist Management", function () {
    it("Should allow owner to add address to whitelist", async function () {
      const { securityToken, investor1 } = await loadFixture(deploySecurityTokenFixture);
      
      await expect(securityToken.addToWhitelist(investor1.address))
        .to.emit(securityToken, "AddedToWhitelist")
        .withArgs(investor1.address);
      
      expect(await securityToken.isWhitelisted(investor1.address)).to.be.true;
    });

    it("Should allow owner to remove address from whitelist", async function () {
      const { securityToken, investor1 } = await loadFixture(deploySecurityTokenFixture);
      
      await securityToken.addToWhitelist(investor1.address);
      
      await expect(securityToken.removeFromWhitelist(investor1.address))
        .to.emit(securityToken, "RemovedFromWhitelist")
        .withArgs(investor1.address);
      
      expect(await securityToken.isWhitelisted(investor1.address)).to.be.false;
    });

    it("Should revert when adding zero address to whitelist", async function () {
      const { securityToken } = await loadFixture(deploySecurityTokenFixture);
      
      await expect(
        securityToken.addToWhitelist(ethers.ZeroAddress)
      ).to.be.revertedWith("VeriFundSecurityToken: cannot whitelist zero address");
    });

    it("Should revert when adding already whitelisted address", async function () {
      const { securityToken, investor1 } = await loadFixture(deploySecurityTokenFixture);
      
      await securityToken.addToWhitelist(investor1.address);
      
      await expect(
        securityToken.addToWhitelist(investor1.address)
      ).to.be.revertedWith("VeriFundSecurityToken: address already whitelisted");
    });

    it("Should revert when removing non-whitelisted address", async function () {
      const { securityToken, investor1 } = await loadFixture(deploySecurityTokenFixture);
      
      await expect(
        securityToken.removeFromWhitelist(investor1.address)
      ).to.be.revertedWith("VeriFundSecurityToken: address not whitelisted");
    });

    it("Should allow batch whitelisting multiple addresses", async function () {
      const { securityToken, investor1, investor2, investor3 } = await loadFixture(deploySecurityTokenFixture);
      
      const addresses = [investor1.address, investor2.address, investor3.address];
      
      await securityToken.addBatchToWhitelist(addresses);
      
      expect(await securityToken.isWhitelisted(investor1.address)).to.be.true;
      expect(await securityToken.isWhitelisted(investor2.address)).to.be.true;
      expect(await securityToken.isWhitelisted(investor3.address)).to.be.true;
    });

    it("Should revert when non-owner tries to manage whitelist", async function () {
      const { securityToken, investor1, unauthorizedUser } = await loadFixture(deploySecurityTokenFixture);
      
      await expect(
        securityToken.connect(unauthorizedUser).addToWhitelist(investor1.address)
      ).to.be.revertedWithCustomError(securityToken, "OwnableUnauthorizedAccount");
    });
  });

  // ============================================================
  // Minting Tests
  // ============================================================

  describe("Minting Security Tokens", function () {
    it("Should mint token to whitelisted address", async function () {
      const { securityToken, investor1 } = await loadFixture(deploySecurityTokenFixture);
      
      await securityToken.addToWhitelist(investor1.address);
      const tokenURI = "ipfs://QmTest123";
      
      await expect(securityToken.safeMint(investor1.address, tokenURI))
        .to.emit(securityToken, "SecurityTokenMinted")
        .withArgs(investor1.address, 0, tokenURI);
      
      expect(await securityToken.ownerOf(0)).to.equal(investor1.address);
      expect(await securityToken.tokenURI(0)).to.equal(tokenURI);
    });

    it("Should increment token IDs correctly", async function () {
      const { securityToken, investor1, investor2 } = await loadFixture(deploySecurityTokenFixture);
      
      await securityToken.addToWhitelist(investor1.address);
      await securityToken.addToWhitelist(investor2.address);
      
      await securityToken.safeMint(investor1.address, "ipfs://token1");
      await securityToken.safeMint(investor2.address, "ipfs://token2");
      
      expect(await securityToken.totalMinted()).to.equal(2);
      expect(await securityToken.ownerOf(0)).to.equal(investor1.address);
      expect(await securityToken.ownerOf(1)).to.equal(investor2.address);
    });

    it("Should revert when minting to non-whitelisted address", async function () {
      const { securityToken, investor1 } = await loadFixture(deploySecurityTokenFixture);
      
      await expect(
        securityToken.safeMint(investor1.address, "ipfs://token1")
      ).to.be.revertedWith("VeriFundSecurityToken: recipient must be whitelisted");
    });

    it("Should revert when minting with empty URI", async function () {
      const { securityToken, investor1 } = await loadFixture(deploySecurityTokenFixture);
      
      await securityToken.addToWhitelist(investor1.address);
      
      await expect(
        securityToken.safeMint(investor1.address, "")
      ).to.be.revertedWith("VeriFundSecurityToken: URI cannot be empty");
    });

    it("Should revert when non-owner tries to mint", async function () {
      const { securityToken, investor1, unauthorizedUser } = await loadFixture(deploySecurityTokenFixture);
      
      await securityToken.addToWhitelist(investor1.address);
      
      await expect(
        securityToken.connect(unauthorizedUser).safeMint(investor1.address, "ipfs://token1")
      ).to.be.revertedWithCustomError(securityToken, "OwnableUnauthorizedAccount");
    });
  });

  // ============================================================
  // Transfer Restriction Tests (Core Security Feature)
  // ============================================================

  describe("Transfer Restrictions", function () {
    it("Should allow transfer to whitelisted address", async function () {
      const { securityToken, investor1, investor2 } = await loadFixture(deploySecurityTokenFixture);
      
      // Setup: mint token to investor1
      await securityToken.addToWhitelist(investor1.address);
      await securityToken.safeMint(investor1.address, "ipfs://token1");
      
      // Whitelist investor2 and transfer
      await securityToken.addToWhitelist(investor2.address);
      
      await expect(
        securityToken.connect(investor1).transferFrom(investor1.address, investor2.address, 0)
      ).to.not.be.reverted;
      
      expect(await securityToken.ownerOf(0)).to.equal(investor2.address);
    });

    it("Should block transfer to non-whitelisted address", async function () {
      const { securityToken, investor1, unauthorizedUser } = await loadFixture(deploySecurityTokenFixture);
      
      await securityToken.addToWhitelist(investor1.address);
      await securityToken.safeMint(investor1.address, "ipfs://token1");
      
      await expect(
        securityToken.connect(investor1).transferFrom(investor1.address, unauthorizedUser.address, 0)
      ).to.be.revertedWith("VeriFundSecurityToken: recipient must be whitelisted for transfers");
    });

    it("Should allow burning (transfer to zero address)", async function () {
      const { securityToken, investor1 } = await loadFixture(deploySecurityTokenFixture);
      
      await securityToken.addToWhitelist(investor1.address);
      await securityToken.safeMint(investor1.address, "ipfs://token1");
      
      // Burning should be allowed even though zero address is not whitelisted
      await expect(
        securityToken.connect(investor1).transferFrom(investor1.address, ethers.ZeroAddress, 0)
      ).to.not.be.reverted;
    });

    it("Should enforce whitelist on safeTransferFrom", async function () {
      const { securityToken, investor1, unauthorizedUser } = await loadFixture(deploySecurityTokenFixture);
      
      await securityToken.addToWhitelist(investor1.address);
      await securityToken.safeMint(investor1.address, "ipfs://token1");
      
      await expect(
        securityToken.connect(investor1)["safeTransferFrom(address,address,uint256)"](
          investor1.address,
          unauthorizedUser.address,
          0
        )
      ).to.be.revertedWith("VeriFundSecurityToken: recipient must be whitelisted for transfers");
    });

    it("Should prevent transfer after removal from whitelist", async function () {
      const { securityToken, investor1, investor2 } = await loadFixture(deploySecurityTokenFixture);
      
      await securityToken.addToWhitelist(investor1.address);
      await securityToken.addToWhitelist(investor2.address);
      await securityToken.safeMint(investor1.address, "ipfs://token1");
      
      // Remove investor2 from whitelist
      await securityToken.removeFromWhitelist(investor2.address);
      
      await expect(
        securityToken.connect(investor1).transferFrom(investor1.address, investor2.address, 0)
      ).to.be.revertedWith("VeriFundSecurityToken: recipient must be whitelisted for transfers");
    });
  });

  // ============================================================
  // Pausability Tests
  // ============================================================

  describe("Pausability", function () {
    it("Should allow owner to pause the contract", async function () {
      const { securityToken, owner } = await loadFixture(deploySecurityTokenFixture);
      
      await expect(securityToken.connect(owner).pause())
        .to.emit(securityToken, "Paused")
        .withArgs(owner.address);
      
      expect(await securityToken.paused()).to.be.true;
    });

    it("Should block minting when paused", async function () {
      const { securityToken, investor1 } = await loadFixture(deploySecurityTokenFixture);
      
      await securityToken.addToWhitelist(investor1.address);
      await securityToken.pause();
      
      await expect(
        securityToken.safeMint(investor1.address, "ipfs://token1")
      ).to.be.revertedWithCustomError(securityToken, "EnforcedPause");
    });

    it("Should block transfers when paused", async function () {
      const { securityToken, investor1, investor2 } = await loadFixture(deploySecurityTokenFixture);
      
      await securityToken.addToWhitelist(investor1.address);
      await securityToken.addToWhitelist(investor2.address);
      await securityToken.safeMint(investor1.address, "ipfs://token1");
      
      await securityToken.pause();
      
      await expect(
        securityToken.connect(investor1).transferFrom(investor1.address, investor2.address, 0)
      ).to.be.revertedWithCustomError(securityToken, "EnforcedPause");
    });

    it("Should allow owner to unpause the contract", async function () {
      const { securityToken, owner } = await loadFixture(deploySecurityTokenFixture);
      
      await securityToken.pause();
      
      await expect(securityToken.connect(owner).unpause())
        .to.emit(securityToken, "Unpaused")
        .withArgs(owner.address);
      
      expect(await securityToken.paused()).to.be.false;
    });

    it("Should revert when non-owner tries to pause", async function () {
      const { securityToken, unauthorizedUser } = await loadFixture(deploySecurityTokenFixture);
      
      await expect(
        securityToken.connect(unauthorizedUser).pause()
      ).to.be.revertedWithCustomError(securityToken, "OwnableUnauthorizedAccount");
    });
  });

  // ============================================================
  // ERC-721 Standard Compliance Tests
  // ============================================================

  describe("ERC-721 Compliance", function () {
    it("Should support ERC-721 interface", async function () {
      const { securityToken } = await loadFixture(deploySecurityTokenFixture);
      
      // ERC-721 interface ID
      const ERC721InterfaceId = "0x80ac58cd";
      expect(await securityToken.supportsInterface(ERC721InterfaceId)).to.be.true;
    });

    it("Should return correct balance for token holders", async function () {
      const { securityToken, investor1 } = await loadFixture(deploySecurityTokenFixture);
      
      await securityToken.addToWhitelist(investor1.address);
      
      expect(await securityToken.balanceOf(investor1.address)).to.equal(0);
      
      await securityToken.safeMint(investor1.address, "ipfs://token1");
      expect(await securityToken.balanceOf(investor1.address)).to.equal(1);
      
      await securityToken.safeMint(investor1.address, "ipfs://token2");
      expect(await securityToken.balanceOf(investor1.address)).to.equal(2);
    });

    it("Should allow approval and transferFrom flow", async function () {
      const { securityToken, investor1, investor2 } = await loadFixture(deploySecurityTokenFixture);
      
      await securityToken.addToWhitelist(investor1.address);
      await securityToken.addToWhitelist(investor2.address);
      await securityToken.safeMint(investor1.address, "ipfs://token1");
      
      // Approve investor2 to transfer
      await securityToken.connect(investor1).approve(investor2.address, 0);
      expect(await securityToken.getApproved(0)).to.equal(investor2.address);
      
      // investor2 transfers on behalf of investor1
      await securityToken.connect(investor2).transferFrom(investor1.address, investor2.address, 0);
      expect(await securityToken.ownerOf(0)).to.equal(investor2.address);
    });
  });

  // ============================================================
  // Integration Tests
  // ============================================================

  describe("Integration Scenarios", function () {
    it("Should support complete investment workflow", async function () {
      const { securityToken, owner, investor1 } = await loadFixture(deploySecurityTokenFixture);
      
      // 1. Investor completes KYC (backend adds to whitelist)
      await securityToken.addToWhitelist(investor1.address);
      
      // 2. Investor makes investment, backend mints security token
      const tokenURI = "ipfs://QmInvestmentDetails_5percent_ProjectAlpha";
      await securityToken.safeMint(investor1.address, tokenURI);
      
      // 3. Verify investor owns the token
      expect(await securityToken.balanceOf(investor1.address)).to.equal(1);
      expect(await securityToken.ownerOf(0)).to.equal(investor1.address);
      
      // 4. Verify token metadata
      expect(await securityToken.tokenURI(0)).to.equal(tokenURI);
    });

    it("Should handle regulatory compliance scenario (KYC expiration)", async function () {
      const { securityToken, investor1, investor2 } = await loadFixture(deploySecurityTokenFixture);
      
      // Initial investment
      await securityToken.addToWhitelist(investor1.address);
      await securityToken.safeMint(investor1.address, "ipfs://token1");
      
      // KYC expires, investor removed from whitelist
      await securityToken.removeFromWhitelist(investor1.address);
      
      // Investor cannot receive new tokens
      await expect(
        securityToken.safeMint(investor1.address, "ipfs://token2")
      ).to.be.revertedWith("VeriFundSecurityToken: recipient must be whitelisted");
      
      // Investor cannot transfer existing token
      await securityToken.addToWhitelist(investor2.address);
      await expect(
        securityToken.connect(investor1).transferFrom(investor1.address, investor2.address, 0)
      ).to.not.be.reverted; // Sender doesn't need to be whitelisted, only recipient
    });
  });
});
