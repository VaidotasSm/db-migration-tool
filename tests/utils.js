const sinon = require('sinon');

exports.stubLog = () => ({
    log: sinon.stub(),
    info: sinon.stub(),
    warning: sinon.stub(),
    error: sinon.stub()
});

exports.stubSequelize = () => {
    const transaction = {
        commit: sinon.stub().resolves(),
        rollback: sinon.stub().resolves()
    };

    const sequelize = {
        authenticate: sinon.stub().resolves(),
        close: sinon.stub().resolves(),
        rollback: sinon.stub().resolves(),
        transaction: () => Promise.resolve(transaction),
        query: sinon.stub().resolves(),
        QueryTypes: {
            INSERT: 'INSERT'
        }
    };
    const Sequelize = function Sequelize() {
        return sequelize;
    };

    return {sequelize, transaction, Sequelize};
};

exports.stubUmzug = () => {
    const umzug = {
        up: sinon.stub(),
        down: sinon.stub(),
        executed: sinon.stub().resolves([]),
        pending: sinon.stub().resolves([]),
        on: sinon.stub()
    };
    const Umzug = function Umzug() {
        return umzug;
    };

    return {umzug, Umzug};
};

exports.getLogMessages = (logMethod, toString = false) => logMethod.getCalls()
    .map(({args}) => (toString ? args[0].toString() : args[0]));
