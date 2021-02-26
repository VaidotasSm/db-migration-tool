const sinon = require('sinon');
const proxyquire = require('proxyquire');
const expect = require('chai').expect;
const {stubSequelize, stubLog, stubUmzug} = require('./utils');

const seedCustom = sinon.stub();

const log = stubLog();
const {sequelize, Sequelize} = stubSequelize();
const {umzug, Umzug} = stubUmzug();

const logger = {
    logResultSummary: sinon.stub()
};
const {MigrationRunner} = proxyquire(`${__dirname}/../src/index`, {
    umzug: Umzug,
    './logging': logger
});

describe('MigrationRunner', () => {
    let migrationRunner;

    beforeEach(() => {
        umzug.up.reset();
        umzug.down.reset();
        umzug.on.reset();
        sequelize.authenticate.reset();
        sequelize.close.reset();
        log.error.resetHistory();
        log.info.resetHistory();
        log.log.resetHistory();
        logger.logResultSummary.reset();

        migrationRunner = new MigrationRunner('Migration Name', {sequelize, Sequelize, log});
    });

    describe('migrate UP', () => {
        it('should run up migration properly', async () => {
            const res = await migrationRunner.up();

            expect(umzug.up.getCalls().length, 'should call up').to.equal(1);
            expect(seedCustom.getCalls().length, 'should not call seed').to.equal(0);
            expect(sequelize.close.getCalls().length, 'should call close').to.equal(1);
            expect(res).to.deep.include({
                success: true,
                migrations: []
            });
        });

        it('should run seedCustom when provided', async () => {
            const res = await migrationRunner.up({seedCustom});

            expect(umzug.up.getCalls().length, 'should call up').to.equal(1);
            expect(seedCustom.getCalls().length, 'should call seed').to.equal(1);
            expect(sequelize.close.getCalls().length, 'should call close').to.equal(1);
            expect(res).to.deep.include({
                success: true,
                migrations: []
            });
        });

        it('should run seedJson when provided', async () => {
            const res = await migrationRunner.up({seedJsonPath: `${__dirname}/mocks/seed`});

            const sqlCalls = sequelize.query.getCalls().map(({args}) => args[0]);
            const sqlInsertCalls = sqlCalls.filter((sql) => sql.includes('INSERT INTO "table_'));

            expect(umzug.up.getCalls().length, 'should call up').to.equal(1);
            expect(sqlInsertCalls.length, 'should seed from json files').to.equal(20);
            expect(sequelize.close.getCalls().length, 'should call close').to.equal(1);
            expect(res).to.deep.include({
                success: true,
                migrations: []
            });
            expect(logger.logResultSummary.getCall(0).args[2], 'should call logResultSummary').to.equal(res);
        });

        it('should handle DB error', async () => {
            sequelize.authenticate.throws(new Error('FAKE ERROR'));

            const error = await migrationRunner.up().then(() => null).catch((err) => err);

            expect(error).to.deep.include({
                success: false,
                migrations: []
            });
            expect(error.migrationError.message).to.equal('FAKE ERROR');
            expect(sequelize.close.getCalls().length, 'should call close').to.equal(1);
            expect(logger.logResultSummary.getCall(0).args[2], 'should call logResultSummary').to.equal(error);
        });

        it('should handle migration error', async () => {
            umzug.up.throws(new Error('FAKE ERROR'));
            umzug.on.withArgs('migrating').yields('migration-2');

            const error = await migrationRunner.up().then(() => null).catch((err) => err);

            expect(umzug.up.getCalls().length, 'should call up').to.equal(1);
            expect(sequelize.close.getCalls().length, 'should call close').to.equal(1);
            expect(error).to.deep.include({
                success: false,
                migrations: ['migration-2']
            });
            expect(error.migrationError.message).to.equal('FAKE ERROR');
            expect(logger.logResultSummary.getCall(0).args[2], 'should call logResultSummary').to.equal(error);
        });
    });

    describe('migrate Down', () => {
        it('should run down migration properly', async () => {
            const result = await migrationRunner.down();

            expect(umzug.down.getCalls().length, 'should call down').to.equal(1);
            expect(sequelize.close.getCalls().length, 'should call close').to.equal(1);
            expect(result).to.include({
                success: true
            });
            expect(logger.logResultSummary.getCall(0).args[2], 'should call logResultSummary').to.equal(result);
        });

        it('should handle error', async () => {
            umzug.down.throws(new Error('FAKE ERROR'));

            let error;
            try {
                await migrationRunner.down();
            } catch (err) {
                error = err;
            }

            expect(umzug.down.getCalls().length, 'should call down').to.equal(1);
            expect(sequelize.close.getCalls().length, 'should call close').to.equal(1);
            expect(error).to.deep.include({
                success: false,
                migrations: []
            });
            expect(error.migrationError.message).to.equal('FAKE ERROR');
            expect(logger.logResultSummary.getCall(0).args[2], 'should call logResultSummary').to.equal(error);
        });
    });

    describe('runtime logging', () => {
        it('should log invoked migrations that when success', async () => {
            umzug.on.withArgs('migrating').yields('migration-2');

            await migrationRunner.up();

            expect(log.info.getCalls().map(({args}) => args[0])).to.deep.equal([
                'Running Migration "migration-2"'
            ]);
        });

        it('should log invoked migrations that when success', async () => {
            umzug.on.withArgs('migrating').yields('migration-2');

            await migrationRunner.down();

            expect(log.info.getCalls().map(({args}) => args[0])).to.deep.equal([
                'Running Migration "migration-2"'
            ]);
        });
    });
});
