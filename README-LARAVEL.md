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
