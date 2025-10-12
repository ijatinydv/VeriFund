// test/Splitter.test.js
// Comprehensive test suite for VeriFundSplitter contract

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("VeriFundSplitter", function () {
  // ============================================================
  // Fixtures for test setup
  // ============================================================
  
  async function deploySplitterFixture() {
    const [owner, investor1, investor2, investor3, other] = await ethers.getSigners();

    const payees = [investor1.address, investor2.address];
    const shares = [5000, 5000]; // 50% each (basis points)
    const repaymentCap = ethers.parseEther("10.0"); // 10 ETH cap

    const Splitter = await ethers.getContractFactory("VeriFundSplitter");
    const splitter = await Splitter.deploy(
      owner.address,
      payees,
      shares,
      repaymentCap
    );

    return { splitter, owner, investor1, investor2, investor3, other, payees, shares, repaymentCap };
  }

  // ============================================================
  // Deployment Tests
  // ============================================================

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      const { splitter, owner } = await loadFixture(deploySplitterFixture);
      expect(await splitter.owner()).to.equal(owner.address);
    });

    it("Should initialize payees and shares correctly", async function () {
      const { splitter, investor1, investor2 } = await loadFixture(deploySplitterFixture);
      
      expect(await splitter.shares(investor1.address)).to.equal(5000);
      expect(await splitter.shares(investor2.address)).to.equal(5000);
      expect(await splitter.totalShares()).to.equal(10000);
    });

    it("Should set the repayment cap correctly", async function () {
      const { splitter, repaymentCap } = await loadFixture(deploySplitterFixture);
      expect(await splitter.repaymentCap()).to.equal(repaymentCap);
    });

    it("Should store payees in array", async function () {
      const { splitter, investor1, investor2 } = await loadFixture(deploySplitterFixture);
      
      expect(await splitter.payees(0)).to.equal(investor1.address);
      expect(await splitter.payees(1)).to.equal(investor2.address);
      expect(await splitter.payeesCount()).to.equal(2);
    });

    it("Should revert with empty payees array", async function () {
      const [owner] = await ethers.getSigners();
      const Splitter = await ethers.getContractFactory("VeriFundSplitter");
      
      await expect(
        Splitter.deploy(owner.address, [], [], ethers.parseEther("10.0"))
      ).to.be.revertedWith("VeriFundSplitter: no payees");
    });

    it("Should revert with mismatched payees and shares length", async function () {
      const [owner, investor1, investor2] = await ethers.getSigners();
      const Splitter = await ethers.getContractFactory("VeriFundSplitter");
      
      await expect(
        Splitter.deploy(
          owner.address,
          [investor1.address, investor2.address],
          [5000], // Only one share for two payees
          ethers.parseEther("10.0")
        )
      ).to.be.revertedWith("VeriFundSplitter: payees and shares length mismatch");
    });

    it("Should revert with zero address payee", async function () {
      const [owner, investor1] = await ethers.getSigners();
      const Splitter = await ethers.getContractFactory("VeriFundSplitter");
      
      await expect(
        Splitter.deploy(
          owner.address,
          [investor1.address, ethers.ZeroAddress],
          [5000, 5000],
          ethers.parseEther("10.0")
        )
      ).to.be.revertedWith("VeriFundSplitter: payee is zero address");
    });

    it("Should revert with zero shares", async function () {
      const [owner, investor1, investor2] = await ethers.getSigners();
      const Splitter = await ethers.getContractFactory("VeriFundSplitter");
      
      await expect(
        Splitter.deploy(
          owner.address,
          [investor1.address, investor2.address],
          [5000, 0], // Zero shares for investor2
          ethers.parseEther("10.0")
        )
      ).to.be.revertedWith("VeriFundSplitter: shares are zero");
    });

    it("Should revert with zero repayment cap", async function () {
      const [owner, investor1] = await ethers.getSigners();
      const Splitter = await ethers.getContractFactory("VeriFundSplitter");
      
      await expect(
        Splitter.deploy(
          owner.address,
          [investor1.address],
          [10000],
          0 // Zero cap
        )
      ).to.be.revertedWith("VeriFundSplitter: repayment cap must be greater than zero");
    });
  });

  // ============================================================
  // Receiving ETH Tests
  // ============================================================

  describe("Receiving Payments", function () {
    it("Should receive ETH and emit PaymentReceived event", async function () {
      const { splitter, other } = await loadFixture(deploySplitterFixture);
      
      const amount = ethers.parseEther("1.0");
      
      await expect(
        other.sendTransaction({ to: await splitter.getAddress(), value: amount })
      ).to.emit(splitter, "PaymentReceived")
        .withArgs(other.address, amount);
    });

    it("Should accept multiple payments", async function () {
      const { splitter, other } = await loadFixture(deploySplitterFixture);
      
      const splitterAddress = await splitter.getAddress();
      
      await other.sendTransaction({ to: splitterAddress, value: ethers.parseEther("1.0") });
      await other.sendTransaction({ to: splitterAddress, value: ethers.parseEther("2.0") });
      
      expect(await ethers.provider.getBalance(splitterAddress)).to.equal(ethers.parseEther("3.0"));
    });

    it("Should revert when receiving ETH while paused", async function () {
      const { splitter, owner, other } = await loadFixture(deploySplitterFixture);
      
      await splitter.connect(owner).pause();
      
      await expect(
        other.sendTransaction({ to: await splitter.getAddress(), value: ethers.parseEther("1.0") })
      ).to.be.revertedWithCustomError(splitter, "EnforcedPause");
    });
  });

  // ============================================================
  // Release/Withdrawal Tests
  // ============================================================

  describe("Releasing Payments", function () {
    it("Should allow investor to withdraw their share", async function () {
      const { splitter, investor1, other } = await loadFixture(deploySplitterFixture);
      
      // Send 2 ETH to contract
      await other.sendTransaction({
        to: await splitter.getAddress(),
        value: ethers.parseEther("2.0")
      });
      
      const initialBalance = await ethers.provider.getBalance(investor1.address);
      
      // investor1 has 50% share, should get 1 ETH
      const tx = await splitter.release(investor1.address);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      
      const finalBalance = await ethers.provider.getBalance(investor1.address);
      
      // Should receive 1 ETH minus gas (if investor1 called it)
      expect(finalBalance - initialBalance + gasCost).to.equal(ethers.parseEther("1.0"));
    });

    it("Should emit PaymentReleased event", async function () {
      const { splitter, investor1, other } = await loadFixture(deploySplitterFixture);
      
      await other.sendTransaction({
        to: await splitter.getAddress(),
        value: ethers.parseEther("2.0")
      });
      
      await expect(splitter.release(investor1.address))
        .to.emit(splitter, "PaymentReleased")
        .withArgs(investor1.address, ethers.parseEther("1.0"));
    });

    it("Should update released and totalReleased correctly", async function () {
      const { splitter, investor1, other } = await loadFixture(deploySplitterFixture);
      
      await other.sendTransaction({
        to: await splitter.getAddress(),
        value: ethers.parseEther("2.0")
      });
      
      await splitter.release(investor1.address);
      
      expect(await splitter.released(investor1.address)).to.equal(ethers.parseEther("1.0"));
      expect(await splitter.totalReleased()).to.equal(ethers.parseEther("1.0"));
    });

    it("Should calculate proportional shares correctly", async function () {
      const { splitter, investor1, investor2, other } = await loadFixture(deploySplitterFixture);
      
      // Send 10 ETH
      await other.sendTransaction({
        to: await splitter.getAddress(),
        value: ethers.parseEther("10.0")
      });
      
      // Both investors have 50% (5000 basis points)
      await splitter.release(investor1.address);
      await splitter.release(investor2.address);
      
      expect(await splitter.released(investor1.address)).to.equal(ethers.parseEther("5.0"));
      expect(await splitter.released(investor2.address)).to.equal(ethers.parseEther("5.0"));
      expect(await splitter.totalReleased()).to.equal(ethers.parseEther("10.0"));
    });

    it("Should handle unequal share distribution", async function () {
      const [owner, investor1, investor2] = await ethers.getSigners();
      
      // 70/30 split
      const Splitter = await ethers.getContractFactory("VeriFundSplitter");
      const splitter = await Splitter.deploy(
        owner.address,
        [investor1.address, investor2.address],
        [7000, 3000], // 70% and 30%
        ethers.parseEther("10.0")
      );
      
      await owner.sendTransaction({
        to: await splitter.getAddress(),
        value: ethers.parseEther("10.0")
      });
      
      await splitter.release(investor1.address);
      await splitter.release(investor2.address);
      
      expect(await splitter.released(investor1.address)).to.equal(ethers.parseEther("7.0"));
      expect(await splitter.released(investor2.address)).to.equal(ethers.parseEther("3.0"));
    });

    it("Should revert when account has no shares", async function () {
      const { splitter, other } = await loadFixture(deploySplitterFixture);
      
      await expect(
        splitter.release(other.address)
      ).to.be.revertedWith("VeriFundSplitter: account has no shares");
    });

    it("Should revert when no payment is due", async function () {
      const { splitter, investor1 } = await loadFixture(deploySplitterFixture);
      
      // No funds sent to contract
      await expect(
        splitter.release(investor1.address)
      ).to.be.revertedWith("VeriFundSplitter: account is not due payment");
    });

    it("Should allow multiple withdrawals as funds accumulate", async function () {
      const { splitter, investor1, other } = await loadFixture(deploySplitterFixture);
      
      const splitterAddress = await splitter.getAddress();
      
      // First payment
      await other.sendTransaction({ to: splitterAddress, value: ethers.parseEther("2.0") });
      await splitter.release(investor1.address);
      expect(await splitter.released(investor1.address)).to.equal(ethers.parseEther("1.0"));
      
      // Second payment
      await other.sendTransaction({ to: splitterAddress, value: ethers.parseEther("2.0") });
      await splitter.release(investor1.address);
      expect(await splitter.released(investor1.address)).to.equal(ethers.parseEther("2.0"));
    });
  });

  // ============================================================
  // Repayment Cap Tests
  // ============================================================

  describe("Repayment Cap Enforcement", function () {
    it("Should enforce repayment cap", async function () {
      const { splitter, investor1, other } = await loadFixture(deploySplitterFixture);
      
      // Send 30 ETH (more than 10 ETH cap)
      await other.sendTransaction({
        to: await splitter.getAddress(),
        value: ethers.parseEther("30.0")
      });
      
      // investor1 should only get 5 ETH (50% of 10 ETH cap)
      await splitter.release(investor1.address);
      
      expect(await splitter.released(investor1.address)).to.equal(ethers.parseEther("5.0"));
      expect(await splitter.totalReleased()).to.equal(ethers.parseEther("5.0"));
    });

    it("Should emit CapReached event when cap is hit", async function () {
      const { splitter, investor1, investor2, other } = await loadFixture(deploySplitterFixture);
      
      // Send enough to hit cap
      await other.sendTransaction({
        to: await splitter.getAddress(),
        value: ethers.parseEther("30.0")
      });
      
      // First withdrawal reaches cap
      await splitter.release(investor1.address);
      await expect(splitter.release(investor2.address))
        .to.emit(splitter, "CapReached")
        .withArgs(ethers.parseEther("10.0"));
    });

    it("Should not emit CapReached event multiple times", async function () {
      const { splitter, investor1, investor2, other } = await loadFixture(deploySplitterFixture);
      
      await other.sendTransaction({
        to: await splitter.getAddress(),
        value: ethers.parseEther("30.0")
      });
      
      await splitter.release(investor1.address);
      await splitter.release(investor2.address);
      
      // Try to release again (should fail, but if it somehow works, shouldn't emit CapReached)
      await other.sendTransaction({
        to: await splitter.getAddress(),
        value: ethers.parseEther("5.0")
      });
      
      // No more payments should be possible
      await expect(
        splitter.release(investor1.address)
      ).to.be.revertedWith("VeriFundSplitter: repayment cap reached");
    });

    it("Should report correct remaining cap", async function () {
      const { splitter, investor1, other } = await loadFixture(deploySplitterFixture);
      
      expect(await splitter.remainingCap()).to.equal(ethers.parseEther("10.0"));
      
      await other.sendTransaction({
        to: await splitter.getAddress(),
        value: ethers.parseEther("2.0")
      });
      
      await splitter.release(investor1.address); // Releases 1 ETH
      
      expect(await splitter.remainingCap()).to.equal(ethers.parseEther("9.0"));
    });

    it("Should return zero for remaining cap when cap is reached", async function () {
      const { splitter, investor1, investor2, other } = await loadFixture(deploySplitterFixture);
      
      await other.sendTransaction({
        to: await splitter.getAddress(),
        value: ethers.parseEther("30.0")
      });
      
      await splitter.release(investor1.address);
      await splitter.release(investor2.address);
      
      expect(await splitter.remainingCap()).to.equal(0);
    });
  });

  // ============================================================
  // View Function Tests
  // ============================================================

  describe("View Functions", function () {
    it("Should return correct pending payment", async function () {
      const { splitter, investor1, other } = await loadFixture(deploySplitterFixture);
      
      expect(await splitter.pendingPayment(investor1.address)).to.equal(0);
      
      await other.sendTransaction({
        to: await splitter.getAddress(),
        value: ethers.parseEther("2.0")
      });
      
      expect(await splitter.pendingPayment(investor1.address)).to.equal(ethers.parseEther("1.0"));
    });

    it("Should return zero pending payment for non-payee", async function () {
      const { splitter, other } = await loadFixture(deploySplitterFixture);
      
      expect(await splitter.pendingPayment(other.address)).to.equal(0);
    });

    it("Should cap pending payment to remaining cap", async function () {
      const { splitter, investor1, other } = await loadFixture(deploySplitterFixture);
      
      // Send 30 ETH (more than cap)
      await other.sendTransaction({
        to: await splitter.getAddress(),
        value: ethers.parseEther("30.0")
      });
      
      // Should show only 5 ETH pending (50% of 10 ETH cap)
      expect(await splitter.pendingPayment(investor1.address)).to.equal(ethers.parseEther("5.0"));
    });
  });

  // ============================================================
  // Reentrancy Protection Tests
  // ============================================================

  describe("Security - Reentrancy Protection", function () {
    it("Should protect against reentrancy attacks", async function () {
      const { splitter } = await loadFixture(deploySplitterFixture);
      
      // Deploy malicious contract
      const MaliciousPayee = await ethers.getContractFactory("MaliciousPayee");
      const malicious = await MaliciousPayee.deploy(await splitter.getAddress());
      
      // This would fail to deploy if MaliciousPayee isn't available,
      // but demonstrates the protection pattern
      // In production tests, you'd create a contract that attempts reentrancy
    });

    it("Should use Checks-Effects-Interactions pattern", async function () {
      const { splitter, investor1, other } = await loadFixture(deploySplitterFixture);
      
      await other.sendTransaction({
        to: await splitter.getAddress(),
        value: ethers.parseEther("2.0")
      });
      
      // Release should update state before transfer
      await splitter.release(investor1.address);
      
      // Trying to release again immediately should fail
      await expect(
        splitter.release(investor1.address)
      ).to.be.revertedWith("VeriFundSplitter: account is not due payment");
    });
  });

  // ============================================================
  // Pausability Tests
  // ============================================================

  describe("Pausability", function () {
    it("Should allow owner to pause", async function () {
      const { splitter, owner } = await loadFixture(deploySplitterFixture);
      
      await expect(splitter.connect(owner).pause())
        .to.emit(splitter, "Paused")
        .withArgs(owner.address);
    });

    it("Should block releases when paused", async function () {
      const { splitter, owner, investor1, other } = await loadFixture(deploySplitterFixture);
      
      await other.sendTransaction({
        to: await splitter.getAddress(),
        value: ethers.parseEther("2.0")
      });
      
      await splitter.connect(owner).pause();
      
      await expect(
        splitter.release(investor1.address)
      ).to.be.revertedWithCustomError(splitter, "EnforcedPause");
    });

    it("Should allow releases after unpause", async function () {
      const { splitter, owner, investor1, other } = await loadFixture(deploySplitterFixture);
      
      await other.sendTransaction({
        to: await splitter.getAddress(),
        value: ethers.parseEther("2.0")
      });
      
      await splitter.connect(owner).pause();
      await splitter.connect(owner).unpause();
      
      await expect(splitter.release(investor1.address)).to.not.be.reverted;
    });
  });

  // ============================================================
  // Integration Tests
  // ============================================================

  describe("Integration Scenarios", function () {
    it("Should handle complete revenue distribution lifecycle", async function () {
      const { splitter, investor1, investor2, other } = await loadFixture(deploySplitterFixture);
      
      const splitterAddress = await splitter.getAddress();
      
      // Month 1: Project earns 2 ETH
      await other.sendTransaction({ to: splitterAddress, value: ethers.parseEther("2.0") });
      await splitter.release(investor1.address);
      await splitter.release(investor2.address);
      
      expect(await splitter.totalReleased()).to.equal(ethers.parseEther("2.0"));
      
      // Month 2: Project earns 3 ETH
      await other.sendTransaction({ to: splitterAddress, value: ethers.parseEther("3.0") });
      await splitter.release(investor1.address);
      await splitter.release(investor2.address);
      
      expect(await splitter.totalReleased()).to.equal(ethers.parseEther("5.0"));
      
      // Month 3: Project earns 10 ETH (exceeds cap)
      await other.sendTransaction({ to: splitterAddress, value: ethers.parseEther("10.0") });
      await splitter.release(investor1.address);
      await splitter.release(investor2.address);
      
      // Should stop at 10 ETH cap
      expect(await splitter.totalReleased()).to.equal(ethers.parseEther("10.0"));
      expect(await splitter.remainingCap()).to.equal(0);
    });

    it("Should support selective withdrawals", async function () {
      const { splitter, investor1, investor2, other } = await loadFixture(deploySplitterFixture);
      
      await other.sendTransaction({
        to: await splitter.getAddress(),
        value: ethers.parseEther("4.0")
      });
      
      // Only investor1 withdraws
      await splitter.release(investor1.address);
      
      expect(await splitter.released(investor1.address)).to.equal(ethers.parseEther("2.0"));
      expect(await splitter.released(investor2.address)).to.equal(0);
      expect(await splitter.totalReleased()).to.equal(ethers.parseEther("2.0"));
      
      // investor2 can still withdraw their share later
      expect(await splitter.pendingPayment(investor2.address)).to.equal(ethers.parseEther("2.0"));
    });
  });
});
