# DB Migrations
Universal library for running Sequelize migrations programmatically (without Sequelize CLI).

# Usage Examples

### Create Instance

```javascript
// dependencies
const Sequelize = require('sequelize');
const sequelize = new Sequelize(/*...*/);
const log = require('./log'); // any logger with api {info, error, warn...}

// MigrationRunner
const {MigrationRunner} = require('db-migration-tool');

const migrationRunner = new MigrationRunner('Migration Group Name', {
    sequelize,
    Sequelize,
    log,
    /*
      optional - can override what is being passed to up()/down() migration scripts
      By default: [sequelize, Sequelize]
    */
    params: [sequelize, Sequelize],
    /*
      optional - change migration metadata Table Name 
      By default: 'migrations'
    */
    modelName: 'migrations'
});
```

### Run Migrations

**Up Migration**
```javascript
const {success, migrations, migrationGroup} = await migrationRunner.up();

// seed from JSON files
const {success, migrations, migrationGroup} = await migrationRunner.up({seedJsonPath: './data'});

// seed from custom function
const seedCustom = (sequelize, Sequelize) => {/* populate DB after schema was initialized */}; 
const {success, migrations, migrationGroup} = await migrationRunner.up({seedCustom});
```

**Down Migration**
```javascript
// Down migration
const {success, migrations, migrationGroup} = await migrationRunner.down();
```


**Run Migrations as CLI**

Script file e.g. `migrate.js`
```
#!/usr/bin/env node
...
migrationRunner.runAsCli();
migrationRunner.runAsCli((sequelize, Sequelize) => ...); // with custom seed function for UP migration
```

CLI Usage
```
migrate.js
migrate.js --seed-json=path/to/json/files
migrate.js --down
```


### Result & Errors

Result Example
```
{
  success: true,
  migrations: [ '0094-grant-readonly-access-to-ta_readonly_user.js' ],
  migrationGroup: 'TA migrations'
}
```

Handle Errors
```javascript
try {
  const {success, migrations, migrationGroup} = await migrationRunner.up();
} catch (err) {
    err.error;  // actual error object
    err.success;  // same as with success
    err.migrations;  // same as with success
    err.migrationGroup;  // same as with success
}
```
