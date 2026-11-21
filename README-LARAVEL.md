# AICS Laravel Backend

Laravel 12 + MySQL backend foundation for the existing AICS frontend.

## Local setup
1. Install PHP 8.2+, Composer and MySQL.
2. Run `composer install`.
3. Copy `.env.example` to `.env`.
4. Set the MySQL database, username and password in `.env`.
5. Run `php artisan key:generate`.
6. Create the database in MySQL.
7. Run `php artisan migrate --seed`.
8. Run `php artisan serve`.

## API base
`/api/v1`

- POST /auth/login
- POST /auth/logout
- GET /auth/me
- PUT /auth/password
- GET /lookups
- GET /transactions
- GET /transactions/search?q=...
- GET /transactions/{id}
- POST /transactions
- PUT /transactions/{id}
- DELETE /transactions/{id} (Administrator)
- GET /drafts, POST /drafts, DELETE /drafts/{id}
- GET /reports/monthly?month=YYYY-MM (Senior staff / Administrator)

## Seed accounts
The seeder creates `staff`, `sstaff`, `admin`, and `viewer` accounts. Passwords are randomly generated unless you explicitly set `AICS_SEED_PASSWORD` before seeding. Accounts require a password change. Configure a secure temporary seed password; do not reuse prototype demo passwords.

## Railway
Create a Railway MySQL service and configure the Laravel service with:
- APP_ENV=production
- APP_DEBUG=false
- APP_KEY=generated Laravel application key
- DB_CONNECTION=mysql
- DB_HOST=${{MySQL.MYSQLHOST}}
- DB_PORT=${{MySQL.MYSQLPORT}}
- DB_DATABASE=${{MySQL.MYSQLDATABASE}}
- DB_USERNAME=${{MySQL.MYSQLUSER}}
- DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}

If your MySQL service is named differently, adjust the Railway variable reference. Migrations are run during deployment using railway.json.

**Note:** The existing JavaScript frontend has not yet been connected to these API endpoints. Existing localStorage sample records are not automatically migrated into MySQL.

## Frontend integration

The Laravel public directory now contains the existing AICS interface and an API bridge.
The interface keeps its current layout and document previews. Authentication, lookup
data, client/beneficiary transaction searches, transaction creation, record listing,
record corrections, and password changes use the Laravel API.

### First deployment credentials

The seeded accounts require a one-time temporary password. Before the first deployment
of this integration, set a strong temporary Railway variable named
`AICS_SEED_PASSWORD`. The database seeder will apply it to the four seeded accounts
(`staff`, `sstaff`, `admin`, and `viewer`) and mark them for password change.
After that deployment succeeds, remove `AICS_SEED_PASSWORD` from Railway and redeploy.
Do not leave this variable configured: when present, each seeding run resets those
four seeded account passwords to its value.

All four initial accounts use the temporary password you configured. Each account
must set its own new password at first login (minimum 10 characters).

### Integration scope

The current API bridge makes authentication and core transaction workflows use MySQL.
Draft management and some administrator maintenance forms are still prototype/local
until their remaining UI actions are connected to the corresponding API endpoints.
