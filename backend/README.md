
## Admin Access
To promote a user to an admin (granting access to internal scraper endpoints), run this SQL against the database:
```sql
UPDATE users SET is_admin = true WHERE email = 'your-email@example.com';
```
