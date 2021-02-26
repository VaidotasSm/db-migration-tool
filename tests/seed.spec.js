/* eslint-disable quotes */
const expect = require('chai').expect;
const {stubSequelize, stubLog} = require('./utils');
const {seedFromJson} = require('../src/seed');

const {sequelize, transaction} = stubSequelize();
const log = stubLog();

const params = {sequelize, log};

describe('Seed', () => {
    describe('seedFromJson', () => {
        beforeEach(() => {
            sequelize.query.reset();
            transaction.commit.reset();
            transaction.rollback.reset();
            log.info.reset();
            log.error.reset();
        });

        it('should generate correct insert sql', async () => {
            await seedFromJson(`${__dirname}/mocks/seed`, params);

            const calls = sequelize.query.getCalls();
            const callArgs = calls.map((call) => call.args[0]);
            expect(calls.length).to.equal(22);
            expect(callArgs[0]).to.equal('TRUNCATE TABLE "table_a" RESTART IDENTITY RESTRICT');
            expect(callArgs[1]).to.equal(`INSERT INTO "table_a" ("id", "col1") VALUES (0, '0')`);
            expect(callArgs[2]).to.equal(`INSERT INTO "table_a" ("id", "col1") VALUES (1, '1')`);
            expect(callArgs[3]).to.equal(`INSERT INTO "table_a" ("id", "col1") VALUES (2, '2')`);
            expect(callArgs[4]).to.equal(`INSERT INTO "table_a" ("id", "col1") VALUES (3, '3')`);
            expect(callArgs[5]).to.equal(`INSERT INTO "table_a" ("id", "col1") VALUES (4, '4')`);
            expect(callArgs[6]).to.equal(`INSERT INTO "table_a" ("id", "col1") VALUES (5, '5')`);
            expect(callArgs[7]).to.equal(`INSERT INTO "table_a" ("id", "col1") VALUES (6, '6')`);
            expect(callArgs[8]).to.equal(`INSERT INTO "table_a" ("id", "col1") VALUES (7, '7')`);
            expect(callArgs[9]).to.equal(`INSERT INTO "table_a" ("id", "col1") VALUES (8, '8')`);
            expect(callArgs[10]).to.equal(`INSERT INTO "table_a" ("id", "col1") VALUES (9, '9')`);
            expect(callArgs[11]).to.equal('TRUNCATE TABLE "table_b" RESTART IDENTITY RESTRICT');
            expect(callArgs[12]).to.equal(`INSERT INTO "table_b" ("id", "col1", "col2") VALUES (0, '0', '0')`);
            expect(callArgs[13]).to.equal(`INSERT INTO "table_b" ("id", "col1", "col2") VALUES (1, '1', '1')`);
            expect(callArgs[14]).to.equal(`INSERT INTO "table_b" ("id", "col1", "col2") VALUES (2, '2', '2')`);
            expect(callArgs[15]).to.equal(`INSERT INTO "table_b" ("id", "col1", "col2") VALUES (3, '3', '3')`);
            expect(callArgs[16]).to.equal(`INSERT INTO "table_b" ("id", "col1", "col2") VALUES (4, '4', '4')`);
            expect(callArgs[17]).to.equal(`INSERT INTO "table_b" ("id", "col1", "col2") VALUES (5, '5', '5')`);
            expect(callArgs[18]).to.equal(`INSERT INTO "table_b" ("id", "col1", "col2") VALUES (6, '6', '6')`);
            expect(callArgs[19]).to.equal(`INSERT INTO "table_b" ("id", "col1", "col2") VALUES (7, '7', '7')`);
            expect(callArgs[20]).to.equal(`INSERT INTO "table_b" ("id", "col1", "col2") VALUES (8, '8', '8')`);
            expect(callArgs[21]).to.equal(`INSERT INTO "table_b" ("id", "col1", "col2") VALUES (9, '9', '9')`);
            expect(transaction.commit.getCalls().length, 'should commit transaction').to.equal(1);
        });

        it('should return response', async () => {
            const result = await seedFromJson(`${__dirname}/mocks/seed`, params);

            expect(result).to.deep.equal({
                executedSeedFiles: ['table_a.json', 'table_b.json'],
                seedCreatedRecords: 20,
                seedError: null
            });
        });

        it('should log', async () => {
            await seedFromJson(`${__dirname}/mocks/seed`, params);

            expect(log.info.getCalls().map((call) => call.args[0])).to.deep.equal([
                'Seed starting for file "table_a.json"',
                'Seed starting for file "table_b.json"'
            ]);
        });

        it('should handle zero files', async () => {
            const result = await seedFromJson(`${__dirname}/mocks/seed-empty`, params);

            expect(sequelize.query.getCalls().length, 'should not call sequelize').to.equal(0);
            expect(result).to.deep.equal({
                executedSeedFiles: [],
                seedCreatedRecords: 0,
                seedError: null
            });
        });

        it('should handle zero records', async () => {
            const result = await seedFromJson(`${__dirname}/mocks/seed-no-records`, params);

            expect(sequelize.query.getCalls().length, 'should not call sequelize').to.equal(0);
            expect(result).to.deep.equal({
                executedSeedFiles: ['table_a.json', 'table_b.json'],
                seedCreatedRecords: 0,
                seedError: null
            });
        });

        it('should handle failure', async () => {
            const originalError = new Error('FAKE ERROR');
            sequelize.query.onCall(2).throws(originalError);

            let error;
            try {
                await seedFromJson(`${__dirname}/mocks/seed`, params);
            } catch (err) {
                error = err;
            }

            expect(error).to.deep.include({
                executedSeedFiles: ['table_a.json'],
                seedCreatedRecords: 1
            });
            expect(error.seedError, 'should throw error').to.equal(originalError);
            expect(transaction.rollback.getCalls().length, 'should rollback transaction').to.equal(1);
        });
    });
});
