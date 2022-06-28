// SPDX-License-Identifier: MIT
// Pragma
pragma solidity ^0.8.0;

// Imports
import "./PriceConverter.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "hardhat/console.sol";

// Error Codes
error FundMe__NotOwner();

// Interfaces

// Libraries

// Contracts

contract FundMe {
    // Type Declarations
    using PriceConverter for uint256;

    // State Variables
    uint256 public constant MINIMUM_USD = 5 * 10**18;
    address[] internal s_funders;
    mapping(address => uint256) internal s_addressToAmountFunded;

    address internal immutable i_owner;
    AggregatorV3Interface internal s_priceFeed;

    // Events

    // Modifiers
    modifier onlyOwner() {
        if (msg.sender != i_owner) revert FundMe__NotOwner();
        _;
    }

    // Functions

    //-// constructor
    constructor(address priceFeedAddress) {
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
        i_owner = msg.sender;
    }

    //-// receive

    receive() external payable {
        fund();
    }

    //-// fallback
    fallback() external payable {
        fund();
    }

    //-// external
    //-// public
    //-// internal
    //-// private
    //-// view / pure

    function fund() public payable {
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "Less than 5U"
        );
        s_addressToAmountFunded[msg.sender] += msg.value;
        // console.log("Msg.sender:%s", msg.sender);
        s_funders.push(msg.sender);
    }

    function withdraw() public payable onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool success, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(success, "Transfer failed");
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunders(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(address funder)
        public
        view
        returns (uint256)
    {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
