const expect = require('chai').expect;
const {MigrationResult} = require('../src/results');
const {logResultSummary} = require('../src/logging');
const {stubLog, getLogMessages} = require('./utils');

const log = stubLog();

const MIGRATIONS = ['migration1.js', 'migration2.js'];
const MIGRATIONS_FAILED = ['migration2.js'];
const SEEDS = ['seed1.js', 'seed2.js'];
const FAKE_ERROR = new Error('FAKE ERROR');

describe('logging', () => {
    beforeEach(() => {
        log.info.resetHistory();
        log.error.resetHistory();
        log.warning.resetHistory();
    });

    describe('logResultSummary', () => {
        describe('when success', () => {
            it('should log when up migration success empty and no seed', async () => {
                await logResultSummary(log, MigrationResult.success(true, []));

                expect(getLogMessages(log.info)).to.deep.equal([
                    'No pending migrations were found',
                    'No seed was run - no seed options were specified'
                ]);
                expect(getLogMessages(log.error, true)).to.deep.equal([]);
            });

            it('should log when down migration success empty and no seed', async () => {
                await logResultSummary(log, MigrationResult.success(false, []));

                expect(getLogMessages(log.info)).to.deep.equal([
                    'No pending migrations were found'
                ]);
                expect(getLogMessages(log.error, true)).to.deep.equal([]);
            });

            it('should log when up migration success and no seed', async () => {
                await logResultSummary(log, MigrationResult.success(true, MIGRATIONS));

                expect(getLogMessages(log.info)).to.deep.equal([
                    'Migration(s) "migration1.js", "migration2.js" completed successfully',
                    'No seed was run - no seed options were specified'
                ]);
                expect(getLogMessages(log.error, true)).to.deep.equal([]);
            });

            it('should log when down migration success and no seed', async () => {
                await logResultSummary(log, MigrationResult.success(false, MIGRATIONS));

                expect(getLogMessages(log.info)).to.deep.equal([
                    'Migration(s) "migration1.js", "migration2.js" reverted successfully'
                ]);
                expect(getLogMessages(log.error, true)).to.deep.equal([]);
            });

            it('should log when up migration success and seed success', async () => {
                await logResultSummary(log, MigrationResult.success(true, MIGRATIONS, SEEDS, 10));

                expect(getLogMessages(log.info)).to.deep.equal([
                    'Migration(s) "migration1.js", "migration2.js" completed successfully',
                    'Seed inserted 10 rows'
                ]);
                expect(getLogMessages(log.error, true)).to.deep.equal([]);
            });
        });

        describe('when failure', () => {
            it('should log when migration success and seed error', async () => {
                await logResultSummary(log, MigrationResult.success(true, MIGRATIONS, SEEDS, 10, FAKE_ERROR));

                expect(getLogMessages(log.info)).to.deep.equal([
                    'Migration(s) "migration1.js", "migration2.js" completed successfully'
                ]);
                expect(getLogMessages(log.error, true)).to.deep.equal([
                    'Error: FAKE ERROR',
                    'Seed failed'
                ]);
            });

            it('should log when migration error and no seed', async () => {
                await logResultSummary(log, MigrationResult.failure(true, MIGRATIONS, MIGRATIONS_FAILED, FAKE_ERROR));

                expect(getLogMessages(log.info)).to.deep.equal([
                    'No seed was run - no seed options were specified'
                ]);
                expect(getLogMessages(log.error, true)).to.deep.equal([
                    'Error: FAKE ERROR',
                    'Migration(s) "migration2.js" failed'
                ]);
            });

            it('should log when migration error and no seed', async () => {
                await logResultSummary(log, MigrationResult.failure(true, MIGRATIONS, MIGRATIONS_FAILED, FAKE_ERROR));

                expect(getLogMessages(log.info)).to.deep.equal([
                    'No seed was run - no seed options were specified'
                ]);
                expect(getLogMessages(log.error, true)).to.deep.equal([
                    'Error: FAKE ERROR',
                    'Migration(s) "migration2.js" failed'
                ]);
            });

            it('should log when migration error and seed error', async () => {
                await logResultSummary(
                    log,
                    MigrationResult.failure(true, MIGRATIONS, MIGRATIONS_FAILED, FAKE_ERROR, SEEDS, 10, FAKE_ERROR)
                );

                expect(getLogMessages(log.info)).to.deep.equal([]);
                expect(getLogMessages(log.error, true)).to.deep.equal([
                    'Error: FAKE ERROR',
                    'Migration(s) "migration2.js" failed',
                    'Error: FAKE ERROR',
                    'Seed failed'
                ]);
            });
        });
    });
});
