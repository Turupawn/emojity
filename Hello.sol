// SPDX-License-Identifier: MIT

pragma solidity 0.8.13;

contract Hello
{
    string public hello = "Hola mundo!";
    uint public count;
    address public last_writer;

    function setHello(string memory _hello) public
    {
        hello = _hello;
        count += 1;
        last_writer = msg.sender;
    }
}