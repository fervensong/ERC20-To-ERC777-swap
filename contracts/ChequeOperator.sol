pragma solidity >0.4.99 <0.6.0;
import "@openzeppelin/contracts/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC777/ERC777.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
contract ChequeOperator {
    using SafeMath for uint256;
    using ECDSA for bytes32;

    mapping(address => mapping(uint256 => bool)) public usedNonces; // For simple sendByCheque

    /* Simple send by Checque */

    function signerOfSimpleCheque(address _token, address _holder, address _to,
    uint256 _amount, bytes memory _data, uint256 _nonce, bytes memory _sig)
    private pure returns (address) {
        return keccak256(abi.encodePacked(_token, _holder, _to, _amount, _data, _nonce)).toEthSignedMessageHash().recover(_sig);
    }

    function sendByCheque(address _token, address _holder, address _to, uint256 _amount, bytes memory _data, uint256 _nonce, bytes memory _sig)
    public {
        require(_to != address(this),"can't send to this address.");

        // Check if signature is valid and get signer's address
        address signer = signerOfSimpleCheque(_token, _holder, _to, _amount, _data, _nonce, _sig);
        require(signer != address(0),"invalid address");
        require(signer == _holder,"signer should be same as holder address");

        // Mark this cheque as used
        require (!usedNonces[signer][_nonce],"nounce duplication");
        usedNonces[signer][_nonce] = true;

        // Send tokens
        ERC777 token = ERC777(_token);
        token.operatorSend(signer, _to, _amount, _data, "");
    }
    function getSigner(address _token, address _holder, address _to, uint256 _amount, bytes memory _data, uint256 _nonce, bytes memory _sig)
    public view returns(address) {
        // Check if signature is valid and get signer's address
        address signer = signerOfSimpleCheque(_token, _holder, _to, _amount, _data, _nonce, _sig);
        return signer;
    }
    function getHash1(address _token, address _holder, address _to, uint256 _amount, bytes memory _data, uint256 _nonce)
    public view returns(bytes32) {
        return keccak256(abi.encodePacked(_token, _holder, _to, _amount, _data, _nonce));
    }
    function getHash2(bytes32 _hash) public view returns(bytes32){
        return _hash.toEthSignedMessageHash();
    }
    function getSignerFromHash(bytes32 _hash, bytes memory _sig) public view returns(address){
        return _hash.recover(_sig);
    }
}