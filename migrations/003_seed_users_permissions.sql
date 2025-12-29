-- Permissões de administrador (todas as ações)
WITH perms AS (
  INSERT INTO permissions (module, actions)
  VALUES
    ('dashboard', ARRAY['view','create','edit','delete','approve']),
    ('comandas', ARRAY['view','create','edit','delete','approve']),
    ('buffet', ARRAY['view','create','edit','delete','approve']),
    ('garcom', ARRAY['view','create','edit','delete','approve']),
    ('caixa', ARRAY['view','create','edit','delete','approve']),
    ('porteiro', ARRAY['view','create','edit','delete','approve']),
    ('estoque', ARRAY['view','create','edit','delete','approve']),
    ('relatorios', ARRAY['view','create','edit','delete','approve']),
    ('cancelamentos', ARRAY['view','create','edit','delete','approve']),
    ('admin', ARRAY['view','create','edit','delete','approve'])
  RETURNING id, module
), admin_user AS (
  INSERT INTO users (name, username, password_hash, role, active, short_code)
  VALUES ('Administrador', 'admin', '$2b$10$sx0SJ2q6CDoUnQNe2j7Jq.LzYZc/2D69Dwn4fk4RnoJ54QJTstmDi', 'admin', true, '001')
  RETURNING id
), link_admin AS (
  INSERT INTO user_permissions (user_id, permission_id)
  SELECT admin_user.id, perms.id FROM admin_user CROSS JOIN perms
)
SELECT 1;

-- Permissões para caixa (restritas)
WITH perms AS (
  INSERT INTO permissions (module, actions)
  VALUES
    ('dashboard', ARRAY['view']),
    ('comandas', ARRAY['view']),
    ('caixa', ARRAY['view','create','edit'])
  RETURNING id, module
), caixa_user AS (
  INSERT INTO users (name, username, password_hash, role, active, short_code)
  VALUES ('Maria Caixa', 'caixa', '$2b$10$RK97bZASpKNmA3rcXQDKYOrdYV/E3KTTF0U/AdjfK9gYmnzJrW7p2', 'caixa', true, '002')
  RETURNING id
), link_caixa AS (
  INSERT INTO user_permissions (user_id, permission_id)
  SELECT caixa_user.id, perms.id FROM caixa_user CROSS JOIN perms
)
SELECT 1;
