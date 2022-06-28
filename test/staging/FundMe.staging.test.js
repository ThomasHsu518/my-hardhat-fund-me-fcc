const { ethers, network, getNamedAccounts } = require("hardhat")
const { assert } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          const valueAmount = ethers.utils.parseEther("0.01")
          let deployer
          let fundMe
          describe("fund", async () => {
              beforeEach(async () => {
                  deployer = (await getNamedAccounts()).deployer
                  fundMe = await ethers.getContract("FundMe", deployer)
              })
              it("deployer can fund", async function () {
                  // Arrange
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)

                  // Act

                  const transactionResponse = await fundMe.fund({
                      value: valueAmount,
                  })

                  const transactionReceipt = await transactionResponse.wait(1)

                  // Assert

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )

                  assert.equal(startingFundMeBalance.toString(), "0")
                  assert.equal(
                      endingFundMeBalance.toString(),
                      valueAmount.toString()
                  )
              })
          })
      })
