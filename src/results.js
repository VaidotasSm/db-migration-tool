/**
 * @typedef {Object} MigrationResult
 * @property {boolean} isUpMigration - UP or Down migration indicator
 * @property {Array<string>} migrations - Migration names that were ran
 * @property {Array<string>} [failedMigrations] - Migration that failed
 * @property {object} [migrationError] - Error that was thrown during migration
 * @property {Array<string>} [executedSeedFiles] - Seed Files
 * @property {number} [seedCreatedRecords] - Rows inserted
 * @property {object} [seedError] - Error that was thrown during data seed
 * @property {boolean} success - Was migration successfully ran
 * @property {function} hasSeeded - Was data seed run
 * @property {function} isSeedSuccess - Was data seed successful
 */
// eslint-disable-next-line max-classes-per-file
class MigrationResult {
    static success(
        isUpMigration,
        migrations,
        executedSeedFiles = null,
        seedCreatedRecords = null,
        seedError = null
    ) {
        return new MigrationResult(
            isUpMigration,
            migrations,
            null,
            null,
            executedSeedFiles,
            seedCreatedRecords,
            seedError
        );
    }

    static failure(
        isUpMigration,
        migrations,
        failedMigrations,
        migrationError,
        executedSeedFiles = null,
        seedCreatedRecords = null,
        seedError = null
    ) {
        return new MigrationResult(
            isUpMigration,
            migrations,
            failedMigrations,
            migrationError,
            executedSeedFiles,
            seedCreatedRecords,
            seedError
        );
    }

    constructor(
        isUpMigration,
        migrations,
        failedMigrations = null,
        migrationError = null,
        executedSeedFiles = null,
        seedCreatedRecords = null,
        seedError = null
    ) {
        this.isUpMigration = isUpMigration;
        this.migrations = migrations;
        this.failedMigrations = failedMigrations;
        this.migrationError = migrationError;
        this.executedSeedFiles = executedSeedFiles;
        this.seedCreatedRecords = seedCreatedRecords;
        this.seedError = seedError;
    }

    get success() {
        return !this.migrationError;
    }

    hasSeeded() {
        return !!this.executedSeedFiles;
    }

    isSeedSuccess() {
        return this.hasSeeded() && !this.seedError;
    }
}

class SeedResult {
    constructor(executedSeedFiles, seedCreatedRecords, seedError = null) {
        this.executedSeedFiles = executedSeedFiles;
        this.seedCreatedRecords = seedCreatedRecords;
        this.seedError = seedError;
    }
}

module.exports = {
    MigrationResult,
    SeedResult
};
