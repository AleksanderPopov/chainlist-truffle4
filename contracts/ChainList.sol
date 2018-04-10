pragma solidity ^0.4.18;

import './Ownable.sol';


contract ChainList is Ownable {

    struct Article {
        uint id;
        address seller;
        address buyer;
        string name;
        string description;
        uint256 price;
    }

    mapping(uint => Article) public articles;
    uint public articleCounter;

    function kill() public ownerOnly {
        selfdestruct(owner);
    }

    event LogSellArticle(address indexed _seller, uint _id, string _name, uint256 _price);

    event LogBuyArticle(uint _id, address indexed _seller, address indexed _buyer, string _name, uint256 _price);

    function sellArticle(string _name, string _description, uint256 _price) public {
        articles[articleCounter] = Article(articleCounter, msg.sender, 0x0, _name, _description, _price);
        LogSellArticle(articles[articleCounter].seller, articleCounter, articles[articleCounter].name, articles[articleCounter].price);
        articleCounter++;
    }

    function buyArticle(uint articleId) payable public {
        require(articleCounter > 0);
        require(articleId >= 0 && articleId < articleCounter);
        require(articles[articleId].buyer == 0x0);
        require(msg.sender != articles[articleId].seller);
        require(msg.value == articles[articleId].price);

        articles[articleId].seller.transfer(msg.value);

        articles[articleId].buyer = msg.sender;

        LogBuyArticle(articles[articleId].id, articles[articleId].seller, articles[articleId].buyer, articles[articleId].name, articles[articleId].price);
    }
}
