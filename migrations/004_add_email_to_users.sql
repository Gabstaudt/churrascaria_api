ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email VARCHAR(120);

-- Ajusta emails para registros existentes
UPDATE users SET email = 'admin@churrascaria.com' WHERE username = 'admin' AND email IS NULL;
UPDATE users SET email = 'caixa@churrascaria.com' WHERE username = 'caixa' AND email IS NULL;

-- Define NOT NULL e unique
ALTER TABLE users ALTER COLUMN email SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT uq_users_email UNIQUE (email);
