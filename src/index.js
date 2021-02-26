const Umzug = require('umzug');
const {ArgumentParser} = require('argparse');
const {seedFromJson} = require('./seed');
const {logResultSummary} = require('./logging');
const {MigrationResult, SeedResult} = require('./results');

const seedData = async (seedCustom, seedJsonPath, {sequelize, log}) => {
    try {
        if (seedCustom && typeof seedCustom === 'function') {
            return (await seedCustom(this.sequelize, this.Sequelize)) || {};
        }
        if (seedJsonPath && typeof seedJsonPath === 'string') {
            return await seedFromJson(seedJsonPath, {sequelize, log});
        }
        return {};
    } catch (error) {
        if (error.seedError) {
            return error;
        }
        return new SeedResult([], 0, error);
    }
};

/**
 * Run Sequelize migrations
 *
 * @type {MigrationRunner}
 */
exports.MigrationRunner = class MigrationRunner {
    /**
     * Construct new Migration Runner
     *
     * @param {string} migrationGroup - printable migration type identifier e.g. "API Migration", "TA Migration"...
     * @param {object} options - description
     * @param {object} options.sequelize - Sequelize instance
     * @param {object} options.Sequelize - Sequelize constructor
     * @param {{info, error, warning}} options.log - Logger instance
     * @param {Array<object>} [options.params=[sequelize, Sequelize]] - params to pass as migration arguments
     * @param {string} [options.path='src/migrations'] - path (from where it's invoked) to migration files
     * @param {pattern} [options.pattern=/^\d+[\w-]+\.js$/] - regex pattern to match migration files
     * @param {string} [modelName='migrations'] - Table Name where migration metadata is stored
     */
    constructor(migrationGroup, {
        sequelize, Sequelize, log, params, path, pattern, modelName
    } = {}) {
        if (!sequelize) {
            throw new Error('"sequelize" instance is required');
        }
        if (!Sequelize) {
            throw new Error('"Sequelize" constructor is required');
        }
        if (!log) {
            throw new Error('"log" parameter is required');
        }
        this.migrationGroup = migrationGroup;
        this.sequelize = sequelize;
        this.Sequelize = Sequelize;
        this.modelName = modelName;
        this.log = log;
        this.params = params;
        this.path = path;
        this.pattern = pattern;
        this.migrationNames = [];
    }

    initConfig() {
        return {
            storage: 'sequelize',
            storageOptions: {
                sequelize: this.sequelize,
                modelName: this.modelName || 'migrations'
            },
            migrations: {
                // params passed to migration scripts e.g. `up(sequelize, Sequelize) => ...`
                params: this.params || [this.sequelize, this.Sequelize],
                pattern: this.pattern || /^\d+[\w-]+\.js$/,
                path: this.path || 'src/migrations'
            }
        };
    }

    async wrapDbCall(migrationOperation) {
        const umzug = new Umzug(this.initConfig());
        umzug.on('migrating', (name) => {
            this.log.info(`Running Migration "${(name)}"`);
            this.migrationNames.push(name);
        });
        umzug.on('reverting', (name) => {
            this.log.info(`Reverting Migration "${(name)}"`);
            this.migrationNames.push(name);
        });

        let migrationResult;
        try {
            await this.sequelize.authenticate();
            migrationResult = await migrationOperation(umzug);
        } catch (err) {
            migrationResult = MigrationResult.failure(this.isUpMigration, [], [], err);
        } finally {
            await this.sequelize.close();
        }

        await logResultSummary(this.log, this.migrationGroup, migrationResult);
        if (!migrationResult.success) {
            throw migrationResult;
        }
        return migrationResult;
    }

    /**
     * Run Up Migration
     *
     * @param {object} [options={}] - Up migration options
     * @param {string} [options.seedJsonPath] - Directory path to seed json files from (filenames match table names)
     * @param {function} [options.seedCustom] - Custom seed function that will populate DB on UP migration
     * @returns {Promise<MigrationResult>} migration results meta info
     * @throws {MigrationResult}
     */
    async up({seedCustom, seedJsonPath} = {}) {
        this.isUpMigration = true;
        return this.wrapDbCall(async (umzug) => {
            try {
                await umzug.up();

                const seedResult = await seedData(seedCustom, seedJsonPath, this);

                return MigrationResult.success(
                    true,
                    this.migrationNames,
                    seedResult.executedSeedFiles,
                    seedResult.seedCreatedRecords,
                    seedResult.seedError
                );
            } catch (error) {
                return MigrationResult.failure(
                    true,
                    this.migrationNames,
                    [this.migrationNames[this.migrationNames.length - 1]],
                    error
                );
            }
        });
    }

    /**
     * Run Down Migration
     *
     * @returns {Promise<MigrationResult>} migration results meta info
     * @throws {MigrationResult}
     */
    async down() {
        this.isUpMigration = false;
        return this.wrapDbCall(async (umzug) => {
            try {
                await umzug.down();
                return MigrationResult.success(false, this.migrationNames);
            } catch (error) {
                return MigrationResult.failure(
                    false,
                    this.migrationNames,
                    [this.migrationNames[this.migrationNames.length - 1]],
                    error
                );
            }
        });
    }

    /**
     * Run as command line handler
     *
     * e.g. "migrate.js" is calling runAsCli() at the root:
     * - migrate.js
     * - migrate.js --down
     * - migrate.js --seed-json=path/to/json/files
     *
     * @param {string} [seedJsonPath] - Default directory path to seed json files from (filenames match table names)
     * @param {function} [seedCustom] - Custom seed function that will populate DB on UP migration
     * @returns {Promise<void>} empty
     */
    async runAsCli({seedJsonPath, seedCustom} = {}) {
        const parser = new ArgumentParser({
            addHelp: true,
            description: 'Migrate adp database'
        });

        parser.addArgument('--down', {
            help: 'Undo last migration',
            action: 'storeTrue',
            defaultValue: false
        });

        parser.addArgument('--seed-json', {
            help: 'Seed from JSON files in specified path',
            type: 'string'
        });

        const {down, seed_json: seedJsonArg} = parser.parseArgs();

        return down ? this.down() : this.up({seedJsonPath: seedJsonArg || seedJsonPath, seedCustom});
    }
};
