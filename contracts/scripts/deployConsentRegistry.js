const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying VeriFundConsentRegistry...");

  // 1. Get the account that is running the script (the deployer)
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const ConsentRegistry = await ethers.getContractFactory("VeriFundConsentRegistry");

  // 2. Pass the deployer's address as the 'initialOwner' to the constructor
  const consentRegistry = await ConsentRegistry.deploy(deployer.address);

  await consentRegistry.waitForDeployment();

  console.log("VeriFundConsentRegistry deployed to:", consentRegistry.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});