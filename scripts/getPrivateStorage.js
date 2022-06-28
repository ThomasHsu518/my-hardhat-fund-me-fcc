// imports
const { ethers, network, getNamedAccounts } = require("hardhat")

// async main
async function main() {
    const { deployer } = await getNamedAccounts()
    const fundMe = await ethers.getContract("FundMe", deployer)
    for (let index = 0; index < 10; index++) {
        const storage = await fundMe.provider.getStorageAt(
            fundMe.address,
            index
        )
        console.log(index, storage)
    }
}

// main
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
