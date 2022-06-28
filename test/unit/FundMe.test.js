const { ethers, deployments, getNamedAccounts, network } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe
          let deployer, thomas
          let mockV3Aggregator
          const valueAmount = ethers.utils.parseEther("1")
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              thomas = (await getNamedAccounts()).thomas
              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("constructor", async () => {
              it("sets the aggregator address correctly", async () => {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })

          describe("receive and fallback", () => {
              let tx
              beforeEach(async () => {
                  tx = {
                      to: fundMe.address,
                      from: deployer,
                      value: "1000000000000000000",
                      gasLimit: 1000000,
                  }
              })
              it("receive will do fund function", async () => {
                  await deployments.rawTx(tx)
                  const currentFundAmount =
                      await fundMe.getAddressToAmountFunded(tx.from)
                  assert.equal(currentFundAmount, tx.value)
              })
              it("fallback will do fund function", async () => {
                  tx.data = "0x00000000"
                  await deployments.rawTx(tx)
                  const currentFundAmount =
                      await fundMe.getAddressToAmountFunded(tx.from)
                  assert.equal(currentFundAmount, tx.value)
              })
          })

          describe("fund", async () => {
              it("Less than 5U", async () => {
                  await expect(fundMe.fund()).to.be.revertedWith("Less than 5U")
              })
              it("Update addressToAmountFunded", async () => {
                  await fundMe.fund({ value: valueAmount })
                  const currentValueAmount =
                      await fundMe.getAddressToAmountFunded(deployer)
                  assert.equal(
                      currentValueAmount.toString(),
                      valueAmount.toString()
                  )
              })
              it("Added to funders list", async () => {
                  await fundMe.fund({ value: valueAmount })
                  const currentFunder = await fundMe.getFunders(0)
                  assert.equal(currentFunder, deployer)
              })
          })

          describe("withdraw", async () => {
              beforeEach(async () => {
                  await fundMe.fund({ value: valueAmount })
              })
              // it("Not Owner", async () => {
              //     fundMeThomas = await ethers.getContract("FundMe", thomas)
              //     expect(await fundMeThomas.withdraw()).to.be.revertedWith(
              //         "FundMe__NotOwner()"
              //     )
              // })
              it("withdraw all", async () => {
                  await fundMe.withdraw()
                  const contractBalance = await ethers.provider.getBalance(
                      fundMe.address
                  )
                  expect(contractBalance).to.equal(0)
              })

              it("deployer get back", async () => {
                  const deployerBalancePrevious =
                      await ethers.provider.getBalance(deployer)
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const deployerBalanceAfter = await ethers.provider.getBalance(
                      deployer
                  )
                  assert.equal(
                      deployerBalanceAfter
                          .sub(deployerBalancePrevious)
                          .add(
                              transactionReceipt.gasUsed.mul(
                                  transactionReceipt.effectiveGasPrice
                              )
                          )
                          .toString(),
                      valueAmount.toString()
                  )
                  // expect(
                  //     deployerBalanceAfter
                  //         .sub(deployerBalancePrevious)
                  //         .add(
                  //             transactionReceipt.gasUsed.mul(
                  //                 transactionReceipt.effectiveGasPrice
                  //             )
                  //         )
                  // ).to.equal(valueAmount)
              })

              it("reset funders list and addressToAmountFunded", async () => {
                  const transactionResponse = await fundMe.withdraw()
                  const deployerAmountFunded =
                      await fundMe.getAddressToAmountFunded(deployer)
                  expect(deployerAmountFunded).to.equal(0)
              })
              it("withdraw with mutiple funders", async () => {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: valueAmount })
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  // Assert
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  const gasFee = transactionReceipt.gasUsed.mul(
                      transactionReceipt.effectiveGasPrice
                  )

                  assert.equal(
                      endingDeployerBalance
                          .sub(startingDeployerBalance)
                          .add(gasFee)
                          .toString(),
                      startingFundMeBalance.sub(endingFundMeBalance).toString()
                  )

                  await expect(fundMe.getFunders(0)).to.be.reverted
                  for (let i = 0; i < 6; i++) {
                      const account = accounts[i]
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              account.address
                          ),
                          0
                      )
                  }
              })
          })

          describe("get_Owner", async () => {
              it("getOwner", async () => {
                  // Arrange
                  const expectOwner = deployer

                  // Act
                  const owner = await fundMe.getOwner()

                  // Assert
                  assert.equal(expectOwner, owner)
              })
          })
      })
