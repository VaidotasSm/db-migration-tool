const logMigrationInfo = (log, migrationResult) => {
    if (migrationResult.migrationError) {
        log.error(migrationResult.migrationError);
        const text = migrationResult.failedMigrations.length > 0
            ? migrationResult.failedMigrations.map((file) => `"${file}"`).join(', ')
            : '"Unknown"';

        log.error(`Migration(s) ${text} ${migrationResult.isUpMigration ? '' : 'revert '}failed`);
    } else if (migrationResult.migrations.length === 0) {
        log.info('No pending migrations were found');
    } else {
        const text = migrationResult.migrations.map((file) => `"${file}"`).join(', ');
        log.info(`Migration(s) ${text} ${migrationResult.isUpMigration ? 'completed' : 'reverted'} successfully`);
    }
};

const logSeedInfo = (log, migrationResult) => {
    if (migrationResult.hasSeeded()) {
        if (migrationResult.seedError) {
            log.error(migrationResult.seedError);
            log.error('Seed failed');
        } else if (migrationResult.seedCreatedRecords) {
            log.info(`Seed inserted ${migrationResult.seedCreatedRecords} rows`);
        } else {
            log.info('Seed skipped - no seed files or records found');
        }
    } else if (migrationResult.isUpMigration) {
        log.info('No seed was run - no seed options were specified');
    }
};

/**
 * Log Migration Result summary
 *
 * @param {object} log - Logger
 * @param {MigrationResult} migrationResult - Migration result
 * @returns {Promise<void>} Empty
 */
exports.logResultSummary = async (log, migrationResult) => {
    try {
        logMigrationInfo(log, migrationResult);
        logSeedInfo(log, migrationResult);
    } catch (err) {
        log.warning(err);
        log.warning('Logging failed');
    }
};
