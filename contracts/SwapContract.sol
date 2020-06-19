//pragma solidity ^0.5.0;
pragma solidity >0.4.99 <0.6.0;
import "@openzeppelin/contracts/ownership/Ownable.sol";        // set specific function for owner only
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";            // safe mathematics functions
import "@openzeppelin/contracts/token/ERC777/ERC777.sol";
import "@openzeppelin/contracts/cryptography/ECDSA.sol";

contract SwapContract is Ownable{
    using SafeMath for uint;
    ERC20 private oldToken;
    ERC777 private newToken;
    uint private minimumDeposit;         // the minimum Deposit allowed
    uint private maximumDeposit;         // the maximum Deposit allowed
    uint private totalDepositedToken;
    uint private totalSwappedToken;

    bool private swapEnable;
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////// data array
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    struct EntityStruct {
    address entityAddress;
    uint entityData;
    uint updateTime ;
    }
    EntityStruct[] public entityStructs;
    mapping(address => bool) knownEntity;
    mapping(address => uint) rowEntity;

    constructor() public payable {
        // owner = msg.sender;         // set the owner of this contract to the creator of the contract
        // oldToken = ERC20(_erc20Token);
        // newToken = ERC777(_erc777Token);
        maximumDeposit = 1000000 * (uint256(10) ** 8);
        minimumDeposit = 1 * (uint256(10) ** 8);
        totalDepositedToken = 0;
        totalSwappedToken = 0;
        swapEnable = false;
    }

    function setAdminParams(uint _minimumDeositAmount, uint _maximumDeositAmount, bool _swapEnable)  public onlyOwner {
        require(_minimumDeositAmount < _maximumDeositAmount, "_minimumDeositAmount can't be greater than _maximumDeositAmount.");
        minimumDeposit = _minimumDeositAmount;
        maximumDeposit = _maximumDeositAmount;
		swapEnable = _swapEnable;
    }
    function setSwapEnable(bool bEnable)  external onlyOwner returns(bool){
        swapEnable = bEnable;
        return true;
    }
    function setTokenAddress(address oldTokenAddress, address newTokenAddress) external onlyOwner returns(bool){
        oldToken = ERC20(oldTokenAddress);
        newToken = ERC777(newTokenAddress);
        return true;
    }
    function getEntityCount() public view returns(uint){
        return entityStructs.length;
    }
    function getTotalDepositedToken() public view returns(uint){
        return totalDepositedToken;
    }
    function getTotalSwappedToken() public view returns(uint){
        return totalSwappedToken;
    }

    function getEntity(uint index) public view returns(uint, address, uint, uint){
        require(index < entityStructs.length, "index is greater than length of structs");
        return (index, entityStructs[index].entityAddress,entityStructs[index].entityData,entityStructs[index].updateTime);
    }
    function getEntityByAddress(address addr) public view returns(uint, address, uint, uint){
        require(knownEntity[addr], "unkown address");
        uint index = rowEntity[addr];
        require(index < entityStructs.length, "index is greater than length of structs");
        return (index,entityStructs[index].entityAddress, entityStructs[index].entityData,entityStructs[index].updateTime);
    }
    function getTransaction(uint stIndex, uint edIndex) public view returns(uint[] memory ids,
    address[] memory addr,uint[] memory amounts,uint[] memory updates){
        require(stIndex >= 0, "stIndex is less than zero");
        require(stIndex < entityStructs.length, "stIndex is greater than array size");
        require(edIndex >= 0, "edIndex is less than zero");
        require(edIndex < entityStructs.length, "edIndex is greater than array size");
        require(stIndex <= edIndex, "stIndex is greater than edIndex");
        uint addressRegistryCount = edIndex - stIndex + 1;
        ids = new uint[](addressRegistryCount);
        addr = new address[](addressRegistryCount);
        amounts = new uint[](addressRegistryCount);
        updates = new uint[](addressRegistryCount);
        for (uint i = 0; i < addressRegistryCount; i++) {
            ids[i] = stIndex + i;
            addr[i] = entityStructs[stIndex + i].entityAddress;
            amounts[i] = entityStructs[stIndex + i].entityData;
            updates[i] = entityStructs[stIndex + i].updateTime;
        }
        return (ids,addr,amounts,updates);
    }

    function getMinimumDepositAmount() public view returns(uint) {
        return minimumDeposit;
    }
    function getMaximumDepositAmount() public view returns(uint) {
        return maximumDeposit;
    }
    function getSwapEnable() public view returns(bool) {
        return swapEnable;
    }
    function getEBTCBalance(address addr) public view returns(uint) {
        return oldToken.balanceOf(addr);
    }
    function getUMCBalance(address addr) public view returns(uint) {
        return newToken.balanceOf(addr);
    }
    ////public interfaces
    function placeDeposit(uint _value) external returns (bool){
        if(swapEnable == false) return false;
        // check that the bet is within the min and max bet limits
        if ((_value < minimumDeposit) || (_value > maximumDeposit)) return false;
        uint256 amount = _value.mul(uint(2*10**10));
        if (amount > newToken.balanceOf(owner())) {
            return false;
        }
        // transfer the required tokens to this contract

        if (!oldToken.transferFrom(msg.sender, address(this), _value)) return false;

        //token transfered so can now create a user or update user balance
        if(isEntity(msg.sender))
        {
            if(!depositEntity(msg.sender, _value)) return false ;
        }
        else{
            if(!newEntity(msg.sender,_value)) return false;
        }

        newToken.operatorSend(owner(), msg.sender, amount, "", "");
        totalSwappedToken = totalSwappedToken.add(amount);

        return true;
    }
    function depositEntity(address entityAddress, uint entityData) public returns(bool success) {
        require(isEntity(entityAddress), "entityAddress is invalid.");
        uint rowNumber = rowEntity[entityAddress];
        require(entityStructs[rowNumber].entityAddress == entityAddress, "entityAddress mismatch.");
        entityStructs[rowNumber].entityData += entityData;
        totalDepositedToken += entityData;
        entityStructs[rowNumber].updateTime = now ;
        return true;
    }
    function isEntity(address entityAddress) public view returns(bool isIndeed) {
        return knownEntity[entityAddress];
    }
    function newEntity(address entityAddress, uint entityData) public returns(bool) {
        require(!isEntity(entityAddress),"entityAddress is exist.");
        EntityStruct memory _newEntity;
        _newEntity.entityAddress = entityAddress;
        _newEntity.entityData = entityData;
        totalDepositedToken = totalDepositedToken.add(entityData);
        _newEntity.updateTime = now;
        knownEntity[entityAddress] = true;
        rowEntity[entityAddress] = entityStructs.push(_newEntity) - 1;
        return true;
    }

}