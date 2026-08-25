ALTER TABLE covers DROP CONSTRAINT covers_book_project_id_fkey;
ALTER TABLE covers ADD CONSTRAINT covers_book_project_id_fkey FOREIGN KEY (book_project_id) REFERENCES book_projects(id);

ALTER TABLE covers DROP CONSTRAINT covers_user_id_fkey;
ALTER TABLE covers ADD CONSTRAINT covers_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE book_projects DROP CONSTRAINT book_projects_user_id_fkey;
ALTER TABLE book_projects ADD CONSTRAINT book_projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_user_id_fkey;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
