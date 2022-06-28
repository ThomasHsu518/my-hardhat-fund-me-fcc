// imports

const { getNamedAccounts, ethers } = require("hardhat")

// async main
async function main() {
    const { deployer } = await getNamedAccounts()
    const fundMe = await ethers.getContract("FundMe", deployer)
    console.log("Funding")
    const transactionResponse = await fundMe.withdraw()
    transactionResponse.wait()
    console.log("Get it back!!!")
}

// main
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
