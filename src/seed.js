const {promisify} = require('util');
const fs = require('fs');
const {SeedResult} = require('./results');

const readFile = promisify(fs.readFile);
const readDir = promisify(fs.readdir);

const insertQuery = (tableName, row) => {
    const columns = Object.keys(row).map((column) => `"${column}"`);
    const values = Object.values(row)
        .map((value) => (typeof value === 'object' ? JSON.stringify(value) : value))
        .map((value) => (typeof value !== 'number' ? `'${value}'` : value));

    return `INSERT INTO "${tableName}" (${columns.join(', ')}) VALUES (${values.join(', ')})`;
};

exports.seedFromJson = async (basePath, {sequelize, log}) => {
    const files = (await readDir(basePath)).filter((file) => file.endsWith('.json'));
    if (files.length === 0) {
        return new SeedResult([], 0);
    }

    const transaction = await sequelize.transaction();
    const executedSeedFiles = [];
    let seedCreatedRecords = 0;
    try {
        for (const file of files) {
            executedSeedFiles.push(file);
            const rows = JSON.parse(await readFile(`${basePath}/${file}`));
            if (rows.length === 0) {
                continue;
            }

            const tableName = file.replace('.json', '');
            await sequelize.query(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY RESTRICT`, {transaction});

            log.info(`Seed starting for file "${file}"`);
            for (const row of rows) {
                await sequelize.query(insertQuery(tableName, row), {
                    type: sequelize.QueryTypes.INSERT,
                    transaction
                });
                seedCreatedRecords += 1;
            }
        }

        await transaction.commit();
        return new SeedResult(executedSeedFiles, seedCreatedRecords);
    } catch (seedError) {
        await transaction.rollback();
        throw new SeedResult(executedSeedFiles, seedCreatedRecords, seedError);
    }
};
