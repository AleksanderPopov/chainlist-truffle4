App = {
    web3Provider: null,
    contracts: {},
    account: '0x0',

    init: function () {
        return App.initWeb3();
    },

    initWeb3: function () {

        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider;
        } else {
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        }
        web3 = new Web3(App.web3Provider);

        App.displayAccountInfo();

        return App.initContract();
    },

    displayAccountInfo: function () {
        web3.eth.getCoinbase((err, acc) => {
            if (err) throw err;
            App.account = acc;

            $('#account').text(acc);

            web3.eth.getBalance(acc, (err, wei) => {
                if (err) throw err;
                $('#accountBalance').text(web3.fromWei(wei, 'ether') + ' ETH');
            });
        });
    },

    initContract: function () {
        $.getJSON('ChainList.json', (artifact) => {

            App.contracts.ChainList = TruffleContract(artifact);

            App.contracts.ChainList.setProvider(App.web3Provider);

            App.listenEvents();

            return App.reloadArticles();
        });
    },

    reloadArticles: async function () {
        const contractInstance = await App.contracts.ChainList.deployed();
        const lastArticleId = await contractInstance.articleCounter() - 1;
        for (let i = lastArticleId; i >= 0; i--) {
            await App.appendArticle(i);
        }
    },

    appendArticle: async function (id) {
        const contractInstance = await App.contracts.ChainList.deployed();
        const article = await contractInstance.articles(id);

        const sellerName = App.account === article[1] ? 'You' : article[1];
        const buyerName = App.account === article[2] ? 'You' : 'Free for now...';
        const name = article[3];
        const description = article[4];
        const priceEth = web3.fromWei(article[5], 'ether');

        const articleTemplate = $('#articleTemplate');
        articleTemplate.find('.panel-title').text(name);
        articleTemplate.find('.article-description').text(description);
        articleTemplate.find('.article-price').text(priceEth);
        articleTemplate.find('.article-seller').text(sellerName);
        articleTemplate.find('.article-buyer').text(buyerName);
        articleTemplate.find('.article-buyer').attr('data-id', id);

        articleTemplate.find('.btn').attr('data-value', article[5]);
        articleTemplate.find('.btn').attr('data-id', id);
        if (sellerName === 'You' || buyerName === 'You' || buyerName === 0x0) {
            articleTemplate.find('.btn-buy').hide();
        } else {
            articleTemplate.find('.btn-buy').show();
        }

        $('#articlesRow').append(articleTemplate.html());
    },

    sellArticle: async function () {
        const aName = $('#article_name').val();
        const aDescription = $('#article_description').val();
        const aPrice = web3.toWei(parseFloat($('#article_price').val() || 0), 'ether');

        const contractInstance = await App.contracts.ChainList.deployed();
        const sellTrx = await contractInstance.sellArticle(aName, aDescription, aPrice, {from: App.account, gas: 500000})
            .catch(err => console.error(err.toString()));
    },

    buyArticle: async function () {
        event.preventDefault();
        const element = $(event.target);
        const id = parseFloat(element.data('id'));
        const price = parseFloat(element.data('value'));

        const contractInstance = await App.contracts.ChainList.deployed();
        const buyTrx = await contractInstance.buyArticle(id, {from: App.account, gas: 500000, value: price})
            .catch(err => console.error(err.toString()));
    },

    listenEvents: function () {
        App.contracts.ChainList.deployed().then(instance => {
            instance.LogSellArticle({}, {}).watch((err, event) => {
                if (err) console.error(err);

                $("#events").append(`<li class="list-group-item">${event.args._name} is now for sale`);
                App.appendArticle(event.args._id);
            });

            instance.LogBuyArticle({}, {}).watch((err, event) => {
                if (err) console.error(err);
                const buyerName = event.args._buyer === App.account ? 'You' : event.args._buyer;

                $("#events").append(`<li class="list-group-item">${event.args._name} is sold`);
                $(`span[data-id="${event.args._id}"]`).text(buyerName);
                $(`button[data-id="${event.args._id}"]`).hide();
            });
        });
    }
};

$(function () {
    $(window).load(function () {
        App.init();
    });
});
