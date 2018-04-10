const ChainList = artifacts.require("./ChainList.sol");

contract('ChailList', function (accounts) {
    let chainListInstance;

    beforeEach(async () => {
        chainListInstance = await ChainList.deployed();
    });

    it('should be initialized with empty values', async () => {
        const data = await article(await lastArticleId() + 1);
        assert.equal(data[1], 0x0);
        assert.equal(data[2], 0x0);
        assert.equal(data[3], '');
        assert.equal(data[4], '');
        assert.equal(data[5], 0);
    });

    it('should sell an article', async () => {
        const name = 'test name';
        const description = 'test description';
        const price = toWei(1);
        const seller = accounts[0];

        const transactionInfo = await sellArticle(name, description, price, seller);
        const contractState = await article(await lastArticleId());

        assert.equal(contractState[1], seller);
        assert.equal(contractState[2], 0x0);
        assert.equal(contractState[3], name);
        assert.equal(contractState[4], description);
        assert.equal(contractState[5].toNumber(), price);
    });

    it('should trigger an event when new article is sold', async () => {
        const name = 'test name';
        const description = 'test description';
        const price = toWei(10);
        const seller = accounts[0];

        const transactionInfo = await sellArticle(name, description, price, seller);
        assert.equal(transactionInfo.logs.length, 1);
        assert.equal(transactionInfo.logs[0].event, 'LogSellArticle');
        assert.equal(transactionInfo.logs[0].args['_seller'], seller);
        assert.equal(transactionInfo.logs[0].args['_name'], name);
        assert.equal(transactionInfo.logs[0].args['_price'], price);
    });

    it('should buy article', async () => {
        const name = 'test name';
        const adescr = 'test descr';
        const price = toWei(1);
        const seller = accounts[0];
        const buyer = accounts[1];

        const sellTransactionInfo = await sellArticle(name, adescr, price, seller);
        const buyTransactionInfo = await buyArticle(await lastArticleId(), buyer, price);

        assert.equal(buyTransactionInfo.logs.length, 1);
        assert.equal(buyTransactionInfo.logs[0].event, 'LogBuyArticle');
        assert.equal(buyTransactionInfo.logs[0].args._seller, seller);
        assert.equal(buyTransactionInfo.logs[0].args._buyer, buyer);
        assert.equal(buyTransactionInfo.logs[0].args._name, name);
        assert.equal(buyTransactionInfo.logs[0].args._price, price);

        const articleData = await article(await lastArticleId());
        assert.equal(articleData[2], buyer);
    });

    it('should not buy article with equal seller and buyer', async () => {
        const name = 'test name';
        const descr = 'test descr';
        const price = toWei(1);
        const seller = accounts[0];
        const buyer = accounts[0];

        const sellTransactionInfo = await sellArticle(name, descr, price, seller);
        const expectedError = await buyArticle(buyer, price).catch(err => err);
        assert(expectedError != undefined);
    });

    it('should not buy article when trying to pay less', async () => {
        const name = 'test name';
        const descr = 'test descr';
        const price = toWei(1);
        const seller = accounts[0];
        const buyer = accounts[1];

        const sellTransactionInfo = await sellArticle(name, descr, price, seller);
        const expectedError = await chainListInstance.buyArticle(buyer, price - 1).catch(err => err);
        assert(expectedError != undefined);
    });

    it('should not buy article when its sold', async () => {
        const name = 'test name';
        const descr = 'test descr';
        const price = toWei(1);
        const seller = accounts[0];
        const buyer = accounts[1];

        const sellTransactionInfo = await sellArticle(name, descr, price, seller);
        const expectedError = await buyArticle(buyer, price - 1).catch(err => err);
        assert(expectedError != undefined);
    });

    it('should sell multiple articles', async () => {
        const name = 'test name';
        const description = 'test description';
        const price = toWei(1);
        const seller = accounts[0];

        let transactionInfo = await sellArticle(name, description, price, seller);
        let articleData = await article(await lastArticleId());

        assert.equal(articleData[1], seller);
        assert.equal(articleData[2], 0x0);
        assert.equal(articleData[3], name);
        assert.equal(articleData[4], description);
        assert.equal(articleData[5].toNumber(), price);

        transactionInfo = await sellArticle(name, description, price, seller);
        articleData = await article(await lastArticleId());

        assert.equal(articleData[1], seller);
        assert.equal(articleData[2], 0x0);
        assert.equal(articleData[3], name);
        assert.equal(articleData[4], description);
        assert.equal(articleData[5].toNumber(), price);
    });

    it('should buy nth article', async () => {
        const name = 'test name';
        const descr = 'test descr';
        const price = toWei(1);
        const seller = accounts[0];
        const buyer = accounts[1];

        const sellTransactionInfo = await sellArticle(name, descr, price, seller)
            .then(() => sellArticle(`${name}2`, `${descr}2`, price + 1, seller));
        const buyTransactionInfo = await buyArticle(await lastArticleId(), buyer, price + 1);

        assert.equal(buyTransactionInfo.logs.length, 1);
        assert.equal(buyTransactionInfo.logs[0].event, 'LogBuyArticle');
        assert.equal(buyTransactionInfo.logs[0].args._seller, seller);
        assert.equal(buyTransactionInfo.logs[0].args._buyer, buyer);
        assert.equal(buyTransactionInfo.logs[0].args._name, `${name}2`);
        assert.equal(buyTransactionInfo.logs[0].args._price, price + 1);

        const articleData = await article(await lastArticleId());
        assert.equal(articleData[2], buyer);
    });

    async function buyArticle(id, buyer, aprice) {
        return await chainListInstance.buyArticle(id, {from: buyer, value: aprice});
    }

    async function sellArticle(name, description, price, from) {
        return await chainListInstance.sellArticle(name, description, price, {from: from});
    }

    async function article(id) {
        return await chainListInstance.articles(id);
    }

    async function lastArticleId() {
        return (await chainListInstance.articleCounter()) - 1;
    }

});

function toWei(ethPrice) {
    return web3.toWei(ethPrice, 'ether');
}
