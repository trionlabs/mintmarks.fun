// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title TestMintmarks
 * @notice A simple ERC1155 NFT contract for testing wallet functionality
 * @dev Anyone can mint by paying 0.00001 ETH fee. No complex SVG, just simple metadata.
 */
contract TestMintmarks is ERC1155, Ownable {
    using Strings for uint256;

    // Mint fee: 0.00001 ETH
    uint256 public constant MINT_FEE = 0.00001 ether;

    // Token counter
    uint256 private _tokenIdCounter;

    // Track mints per address
    mapping(address => uint256) public mintCount;

    // Events
    event TestMinted(address indexed minter, uint256 indexed tokenId, uint256 timestamp);

    error InsufficientFee(uint256 sent, uint256 required);
    error WithdrawFailed();

    constructor() ERC1155("") Ownable(msg.sender) {}

    /**
     * @notice Mint a test NFT
     */
    function mint() external payable returns (uint256 tokenId) {
        if (msg.value < MINT_FEE) {
            revert InsufficientFee(msg.value, MINT_FEE);
        }

        tokenId = _tokenIdCounter++;
        mintCount[msg.sender]++;

        _mint(msg.sender, tokenId, 1, "");

        emit TestMinted(msg.sender, tokenId, block.timestamp);
    }

    function name() public pure returns (string memory) {
        return "Test Mintmarks";
    }

    function symbol() public pure returns (string memory) {
        return "TMARK";
    }

    function uri(uint256 tokenId) public pure override returns (string memory) {
        return string(
            abi.encodePacked(
                "data:application/json,",
                '{"name":"Test Mark #', tokenId.toString(),
                '","description":"Test NFT on Base Sepolia",',
                '"attributes":[{"trait_type":"Type","value":"Test"}]}'
            )
        );
    }

    function totalMinted() external view returns (uint256) {
        return _tokenIdCounter;
    }

    function withdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        if (!success) revert WithdrawFailed();
    }

    function hasMinted(address account) external view returns (bool) {
        return mintCount[account] > 0;
    }
}
