module.exports = {
    // See <http://truffleframework.com/docs/advanced/configuration>
    // to customize your Truffle configuration!
    networks: {
        ganache: {
            host: "localhost",
            port: 7545,
            network_id: "*" // Match any network id
        },
        geth: {
            host: "localhost",
            port: 8545,
            network_id: "*", // Match any network id
            gas: 4700000,
            from: '0x49b7e183cca777a06ccff3df0c0ef67de8556e27'
        },
        rinkeby: {
            host: "localhost",
            port: 8545,
            network_id: 4, // rinkeby test network
            gas: 4700000
        }
    }
};
