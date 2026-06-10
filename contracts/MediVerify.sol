// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MediVerify is Ownable {
    
    struct Batch {
        string batchId;
        string medicineName;
        uint256 totalPills;
        uint256 expiryDate;
        address manufacturer;
        bool isRegistered;
        bool isRecalled;
    }

    struct Pill {
        string pillQR;
        string batchId;
        uint256 pillNumber;
        bool isRegistered;
    }

    struct Verification {
        uint256 timestamp;
        string location;
        string status;
    }

    mapping(string => Batch) public batches;
    mapping(string => Pill) public pills;
    mapping(string => Verification[]) public pillHistory;
    mapping(string => uint256) public duplicateCounts;
    mapping(address => bool) public verifiedManufacturers;

    event BatchRegistered(string indexed batchId, string medicineName, address manufacturer);
    event PillRegistered(string indexed pillQR, string batchId);
    event PillVerified(string indexed pillQR, string status, string location, uint256 timestamp);
    event DuplicateDetected(string indexed pillQR, uint256 count);
    event ManufacturerAuthorized(address indexed manufacturer);

    constructor() Ownable(msg.sender) {}

    modifier onlyVerifiedManufacturer() {
        require(verifiedManufacturers[msg.sender] || msg.sender == owner(), "Not an authorized manufacturer.");
        _;
    }

    function authorizeManufacturer(address manufacturer) external onlyOwner {
        verifiedManufacturers[manufacturer] = true;
        emit ManufacturerAuthorized(manufacturer);
    }

    function registerBatch(
        string memory _batchId,
        string memory _medicineName,
        uint256 _totalPills,
        uint256 _expiryDate
    ) external onlyVerifiedManufacturer {
        require(!batches[_batchId].isRegistered, "Batch already registered.");

        batches[_batchId] = Batch({
            batchId: _batchId,
            medicineName: _medicineName,
            totalPills: _totalPills,
            expiryDate: _expiryDate,
            manufacturer: msg.sender,
            isRegistered: true,
            isRecalled: false
        });

        emit BatchRegistered(_batchId, _medicineName, msg.sender);
    }

    function registerPill(
        string memory _pillQR,
        string memory _batchId,
        uint256 _pillNumber
    ) external onlyVerifiedManufacturer {
        require(batches[_batchId].isRegistered, "Parent batch not registered.");
        require(!pills[_pillQR].isRegistered, "Pill already registered.");

        pills[_pillQR] = Pill({
            pillQR: _pillQR,
            batchId: _batchId,
            pillNumber: _pillNumber,
            isRegistered: true
        });

        emit PillRegistered(_pillQR, _batchId);
    }

    function verifyPill(
        string memory _pillQR,
        string memory _location,
        string memory _status
    ) external {
        require(pills[_pillQR].isRegistered, "Pill not found on-chain.");

        pillHistory[_pillQR].push(Verification({
            timestamp: block.timestamp,
            location: _location,
            status: _status
        }));

        if (pillHistory[_pillQR].length > 1) {
            duplicateCounts[_pillQR]++;
            emit DuplicateDetected(_pillQR, duplicateCounts[_pillQR]);
        }

        emit PillVerified(_pillQR, _status, _location, block.timestamp);
    }

    function getPillHistory(string memory _pillQR) external view returns (Verification[] memory) {
        return pillHistory[_pillQR];
    }
}
