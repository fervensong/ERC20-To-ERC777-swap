pragma solidity >0.4.99 <0.6.0;
import "@openzeppelin/contracts/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC777/ERC777.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
contract BatchSend {
    using SafeMath for uint256;
    using ECDSA for bytes32;

     /**
     * Send a given amount of tokens to multiple recipients
     * @param _token the address of the token contract
     * @param _recipients the list of recipents
     * @param _amount the amount of tokens to send to each recipient
     * @param _data the data to attach to each send
     */
    function send(address _token, address[] memory _recipients, uint256 _amount, bytes memory _data) public {
        // Send tokens
        ERC777 token = ERC777(_token);
        for (uint256 i = 0; i < _recipients.length; i++) {
            token.operatorSend(msg.sender, _recipients[i], _amount, _data, "");
        }
    }

    /**
     * Send individual amounts of tokens to multiple recipients
     * @param _token the address of the token contract
     * @param _recipients the list of recipents
     * @param _amounts the amount of tokens to send to each recipient
     * @param _data the data to attach to each send
     */
    function sendAmounts(address _token, address[] memory _recipients, uint256[] memory _amounts, bytes memory _data) public {
        require(_recipients.length == _amounts.length,"the length of recipient and amount should be same.");
        ERC777 token = ERC777(_token);
        for (uint256 i = 0; i < _recipients.length; i++) {
            token.operatorSend(msg.sender, _recipients[i], _amounts[i], _data, "");
        }
    }

}