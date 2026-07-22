/*
# Seed topics: Direito Penal Comum, Direito Processual Penal Comum, Direito Penal Militar

## Summary
Inserts topics for 3 law disciplines with hierarchical structure for the
Código Penal (Parte Geral + Parte Especial) and Código Penal Militar.

## Topics
### Direito Penal Comum (2 parent + 19 child topics)
- Parte Geral: Título I ao VIII (8 children)
- Parte Especial: Título I ao XI (11 children)

### Direito Processual Penal Comum (6 topics)
- CPP Título I ao III, VII ao IX, Livro III Título I
- Lei 7.960/1989, Lei 9.099/1995, Lei 10.259/2001

### Direito Penal Militar (2 parent + 16 child topics)
- Parte Geral: Título I ao VIII (8 children)
- Parte Especial: Título I ao VIII (8 children)
*/

-- Direito Penal Comum: parents
INSERT INTO topics (discipline_id, title, fibonacci_weight, sort_order, parent_id)
VALUES
  ('direito_penal_comum', 'Parte Geral', 89, 1, NULL),
  ('direito_penal_comum', 'Parte Especial', 55, 2, NULL);

-- Direito Penal Comum: Parte Geral children (Título I ao VIII)
INSERT INTO topics (discipline_id, title, fibonacci_weight, sort_order, parent_id)
SELECT 'direito_penal_comum', t.title, t.fw, t.so, p.id
FROM (VALUES
  ('Título I', 55, 1),
  ('Título II', 55, 2),
  ('Título III', 34, 3),
  ('Título IV', 34, 4),
  ('Título V', 21, 5),
  ('Título VI', 21, 6),
  ('Título VII', 13, 7),
  ('Título VIII', 13, 8)
) AS t(title, fw, so)
CROSS JOIN (SELECT id FROM topics WHERE discipline_id = 'direito_penal_comum' AND title = 'Parte Geral' AND parent_id IS NULL LIMIT 1) p
WHERE p.id IS NOT NULL;

-- Direito Penal Comum: Parte Especial children (Título I ao XI)
INSERT INTO topics (discipline_id, title, fibonacci_weight, sort_order, parent_id)
SELECT 'direito_penal_comum', t.title, t.fw, t.so, p.id
FROM (VALUES
  ('Título I', 55, 1),
  ('Título II', 34, 2),
  ('Título III', 34, 3),
  ('Título IV', 21, 4),
  ('Título V', 21, 5),
  ('Título VI', 13, 6),
  ('Título VII', 13, 7),
  ('Título VIII', 8, 8),
  ('Título IX', 8, 9),
  ('Título X', 5, 10),
  ('Título XI', 5, 11)
) AS t(title, fw, so)
CROSS JOIN (SELECT id FROM topics WHERE discipline_id = 'direito_penal_comum' AND title = 'Parte Especial' AND parent_id IS NULL LIMIT 1) p
WHERE p.id IS NOT NULL;

-- Direito Processual Penal Comum
INSERT INTO topics (discipline_id, title, fibonacci_weight, sort_order) VALUES
  ('direito_processual_penal_comum', 'CPP - Título I ao III', 55, 1),
  ('direito_processual_penal_comum', 'CPP - Título VII ao IX', 89, 2),
  ('direito_processual_penal_comum', 'CPP - Livro III Título I', 34, 3),
  ('direito_processual_penal_comum', 'Lei 7.960/1989', 21, 4),
  ('direito_processual_penal_comum', 'Lei 9.099/1995', 55, 5),
  ('direito_processual_penal_comum', 'Lei 10.259/2001', 13, 6);

-- Direito Penal Militar: parents
INSERT INTO topics (discipline_id, title, fibonacci_weight, sort_order, parent_id)
VALUES
  ('direito_penal_militar', 'Parte Geral', 89, 1, NULL),
  ('direito_penal_militar', 'Parte Especial', 55, 2, NULL);

-- Direito Penal Militar: Parte Geral children (Título I ao VIII)
INSERT INTO topics (discipline_id, title, fibonacci_weight, sort_order, parent_id)
SELECT 'direito_penal_militar', t.title, t.fw, t.so, p.id
FROM (VALUES
  ('Título I', 55, 1),
  ('Título II', 55, 2),
  ('Título III', 34, 3),
  ('Título IV', 34, 4),
  ('Título V', 21, 5),
  ('Título VI', 21, 6),
  ('Título VII', 13, 7),
  ('Título VIII', 13, 8)
) AS t(title, fw, so)
CROSS JOIN (SELECT id FROM topics WHERE discipline_id = 'direito_penal_militar' AND title = 'Parte Geral' AND parent_id IS NULL LIMIT 1) p
WHERE p.id IS NOT NULL;

-- Direito Penal Militar: Parte Especial children (Título I ao VIII)
INSERT INTO topics (discipline_id, title, fibonacci_weight, sort_order, parent_id)
SELECT 'direito_penal_militar', t.title, t.fw, t.so, p.id
FROM (VALUES
  ('Título I', 55, 1),
  ('Título II', 34, 2),
  ('Título III', 34, 3),
  ('Título IV', 21, 4),
  ('Título V', 21, 5),
  ('Título VI', 13, 6),
  ('Título VII', 13, 7),
  ('Título VIII', 8, 8)
) AS t(title, fw, so)
CROSS JOIN (SELECT id FROM topics WHERE discipline_id = 'direito_penal_militar' AND title = 'Parte Especial' AND parent_id IS NULL LIMIT 1) p
WHERE p.id IS NOT NULL;
