// test/ConsentRegistry.test.js
// Comprehensive test suite for VeriFundConsentRegistry contract

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("VeriFundConsentRegistry", function () {
  // ============================================================
  // Fixtures for test setup
  // ============================================================
  
  /**
   * Deployment fixture - deploys fresh contract for each test
   * This pattern is more efficient than deploying in beforeEach
   */
  async function deployConsentRegistryFixture() {
    const [owner, user1, user2, unauthorizedUser] = await ethers.getSigners();

    const ConsentRegistry = await ethers.getContractFactory("VeriFundConsentRegistry");
    const consentRegistry = await ConsentRegistry.deploy(owner.address);

    return { consentRegistry, owner, user1, user2, unauthorizedUser };
  }

  // ============================================================
  // Deployment Tests
  // ============================================================

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      const { consentRegistry, owner } = await loadFixture(deployConsentRegistryFixture);
      expect(await consentRegistry.owner()).to.equal(owner.address);
    });

    it("Should deploy successfully with valid initial owner", async function () {
      const { consentRegistry } = await loadFixture(deployConsentRegistryFixture);
      expect(await consentRegistry.getAddress()).to.be.properAddress;
    });
  });

  // ============================================================
  // Consent Logging Tests
  // ============================================================

  describe("Logging Consents", function () {
    it("Should log consent with correct event parameters", async function () {
      const { consentRegistry, owner, user1 } = await loadFixture(deployConsentRegistryFixture);
      
      const consentType = ethers.encodeBytes32String("TERMS_V1");
      const documentHash = ethers.keccak256(ethers.toUtf8Bytes("Investment Agreement v1.0"));
      
      await expect(consentRegistry.logConsent(user1.address, consentType, documentHash))
        .to.emit(consentRegistry, "ConsentLogged")
        .withArgs(
          user1.address,
          consentType,
          documentHash,
          await time.latest() + 1 // Next block timestamp
        );
    });

    it("Should log multiple consents for the same user", async function () {
      const { consentRegistry, user1 } = await loadFixture(deployConsentRegistryFixture);
      
      const consentType1 = ethers.encodeBytes32String("TERMS_V1");
      const consentType2 = ethers.encodeBytes32String("KYC_CONSENT");
      const documentHash1 = ethers.keccak256(ethers.toUtf8Bytes("Terms v1"));
      const documentHash2 = ethers.keccak256(ethers.toUtf8Bytes("KYC Form"));
      
      await expect(consentRegistry.logConsent(user1.address, consentType1, documentHash1))
        .to.emit(consentRegistry, "ConsentLogged");
      
      await expect(consentRegistry.logConsent(user1.address, consentType2, documentHash2))
        .to.emit(consentRegistry, "ConsentLogged");
    });

    it("Should log consents for different users", async function () {
      const { consentRegistry, user1, user2 } = await loadFixture(deployConsentRegistryFixture);
      
      const consentType = ethers.encodeBytes32String("TERMS_V1");
      const documentHash = ethers.keccak256(ethers.toUtf8Bytes("Agreement"));
      
      await expect(consentRegistry.logConsent(user1.address, consentType, documentHash))
        .to.emit(consentRegistry, "ConsentLogged")
        .withArgs(user1.address, consentType, documentHash, await time.latest() + 1);
      
      await expect(consentRegistry.logConsent(user2.address, consentType, documentHash))
        .to.emit(consentRegistry, "ConsentLogged")
        .withArgs(user2.address, consentType, documentHash, await time.latest() + 1);
    });

    it("Should record accurate timestamps", async function () {
      const { consentRegistry, user1 } = await loadFixture(deployConsentRegistryFixture);
      
      const consentType = ethers.encodeBytes32String("TERMS_V1");
      const documentHash = ethers.keccak256(ethers.toUtf8Bytes("Agreement"));
      
      const tx = await consentRegistry.logConsent(user1.address, consentType, documentHash);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "ConsentLogged"
      );
      
      expect(event.args.timestamp).to.equal(block.timestamp);
    });
  });

  // ============================================================
  // Access Control Tests
  // ============================================================

  describe("Access Control", function () {
    it("Should allow only owner to log consents", async function () {
      const { consentRegistry, owner, user1 } = await loadFixture(deployConsentRegistryFixture);
      
      const consentType = ethers.encodeBytes32String("TERMS_V1");
      const documentHash = ethers.keccak256(ethers.toUtf8Bytes("Agreement"));
      
      await expect(
        consentRegistry.connect(owner).logConsent(user1.address, consentType, documentHash)
      ).to.not.be.reverted;
    });

    it("Should revert when non-owner tries to log consent", async function () {
      const { consentRegistry, user1, unauthorizedUser } = await loadFixture(deployConsentRegistryFixture);
      
      const consentType = ethers.encodeBytes32String("TERMS_V1");
      const documentHash = ethers.keccak256(ethers.toUtf8Bytes("Agreement"));
      
      await expect(
        consentRegistry.connect(unauthorizedUser).logConsent(user1.address, consentType, documentHash)
      ).to.be.revertedWithCustomError(consentRegistry, "OwnableUnauthorizedAccount")
        .withArgs(unauthorizedUser.address);
    });

    it("Should allow owner to transfer ownership", async function () {
      const { consentRegistry, owner, user1 } = await loadFixture(deployConsentRegistryFixture);
      
      await expect(consentRegistry.connect(owner).transferOwnership(user1.address))
        .to.emit(consentRegistry, "OwnershipTransferred")
        .withArgs(owner.address, user1.address);
      
      expect(await consentRegistry.owner()).to.equal(user1.address);
    });
  });

  // ============================================================
  // Edge Cases and Input Validation
  // ============================================================

  describe("Edge Cases", function () {
    it("Should handle zero address as user (for system-wide consents)", async function () {
      const { consentRegistry } = await loadFixture(deployConsentRegistryFixture);
      
      const consentType = ethers.encodeBytes32String("TERMS_V1");
      const documentHash = ethers.keccak256(ethers.toUtf8Bytes("Agreement"));
      
      await expect(
        consentRegistry.logConsent(ethers.ZeroAddress, consentType, documentHash)
      ).to.emit(consentRegistry, "ConsentLogged");
    });

    it("Should handle empty bytes32 values", async function () {
      const { consentRegistry, user1 } = await loadFixture(deployConsentRegistryFixture);
      
      const emptyBytes = ethers.ZeroHash;
      
      await expect(
        consentRegistry.logConsent(user1.address, emptyBytes, emptyBytes)
      ).to.emit(consentRegistry, "ConsentLogged");
    });

    it("Should handle rapid consecutive consent logging", async function () {
      const { consentRegistry, user1 } = await loadFixture(deployConsentRegistryFixture);
      
      const consentType = ethers.encodeBytes32String("TERMS_V1");
      const documentHash = ethers.keccak256(ethers.toUtf8Bytes("Agreement"));
      
      // Log 10 consents rapidly
      for (let i = 0; i < 10; i++) {
        await expect(
          consentRegistry.logConsent(user1.address, consentType, documentHash)
        ).to.emit(consentRegistry, "ConsentLogged");
      }
    });
  });

  // ============================================================
  // Gas Optimization Tests
  // ============================================================

  describe("Gas Efficiency", function () {
    it("Should be gas-efficient for single consent logging", async function () {
      const { consentRegistry, user1 } = await loadFixture(deployConsentRegistryFixture);
      
      const consentType = ethers.encodeBytes32String("TERMS_V1");
      const documentHash = ethers.keccak256(ethers.toUtf8Bytes("Agreement"));
      
      const tx = await consentRegistry.logConsent(user1.address, consentType, documentHash);
      const receipt = await tx.wait();
      
      // Event-based logging should use minimal gas (< 50k)
      expect(receipt.gasUsed).to.be.lessThan(50000);
    });
  });

  // ============================================================
  // Integration Tests
  // ============================================================

  describe("Integration Scenarios", function () {
    it("Should support complete user onboarding flow", async function () {
      const { consentRegistry, user1 } = await loadFixture(deployConsentRegistryFixture);
      
      // User accepts terms
      const termsType = ethers.encodeBytes32String("TERMS_V1");
      const termsHash = ethers.keccak256(ethers.toUtf8Bytes("Terms of Service v1.0"));
      await expect(consentRegistry.logConsent(user1.address, termsType, termsHash))
        .to.emit(consentRegistry, "ConsentLogged");
      
      // User completes KYC
      const kycType = ethers.encodeBytes32String("KYC_CONSENT");
      const kycHash = ethers.keccak256(ethers.toUtf8Bytes("KYC Form Data"));
      await expect(consentRegistry.logConsent(user1.address, kycType, kycHash))
        .to.emit(consentRegistry, "ConsentLogged");
      
      // User accepts DPDP data processing
      const dpdpType = ethers.encodeBytes32String("DPDP_CONSENT");
      const dpdpHash = ethers.keccak256(ethers.toUtf8Bytes("DPDP Data Processing Agreement"));
      await expect(consentRegistry.logConsent(user1.address, dpdpType, dpdpHash))
        .to.emit(consentRegistry, "ConsentLogged");
    });

    it("Should support consent updates (new versions)", async function () {
      const { consentRegistry, user1 } = await loadFixture(deployConsentRegistryFixture);
      
      // Original terms
      const termsV1 = ethers.encodeBytes32String("TERMS_V1");
      const hashV1 = ethers.keccak256(ethers.toUtf8Bytes("Terms v1"));
      await consentRegistry.logConsent(user1.address, termsV1, hashV1);
      
      // Updated terms
      const termsV2 = ethers.encodeBytes32String("TERMS_V2");
      const hashV2 = ethers.keccak256(ethers.toUtf8Bytes("Terms v2"));
      await expect(consentRegistry.logConsent(user1.address, termsV2, hashV2))
        .to.emit(consentRegistry, "ConsentLogged");
    });
  });
});
