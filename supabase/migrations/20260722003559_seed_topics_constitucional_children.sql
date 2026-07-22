/*
# Seed topics: Direito Constitucional children

## Summary
Inserts child topics (article ranges) under the two parent topics:
- Constituição Federal (id from previous migration)
- Constituição Estadual de Santa Catarina (id from previous migration)

Uses a subquery to find parent IDs by title to be idempotent.
*/

-- Children of Constituição Federal
INSERT INTO topics (discipline_id, title, fibonacci_weight, sort_order, parent_id)
SELECT 'direito_constitucional', t.title, t.fw, t.so, p.id
FROM (VALUES
  ('Art. 1º ao 6º', 55, 1),
  ('Art. 14 e 15', 34, 2),
  ('Art. 18 ao 28', 34, 3),
  ('Art. 37 ao 42', 89, 4),
  ('Art. 70 ao 75', 21, 5),
  ('Art. 106 ao 110', 13, 6),
  ('Art. 122 ao 144', 21, 7)
) AS t(title, fw, so)
CROSS JOIN (SELECT id FROM topics WHERE discipline_id = 'direito_constitucional' AND title = 'Constituição Federal' AND parent_id IS NULL LIMIT 1) p
WHERE p.id IS NOT NULL;

-- Children of Constituição Estadual de Santa Catarina
INSERT INTO topics (discipline_id, title, fibonacci_weight, sort_order, parent_id)
SELECT 'direito_constitucional', t.title, t.fw, t.so, p.id
FROM (VALUES
  ('Art. 1º ao 40', 34, 1),
  ('Art. 90', 13, 2),
  ('Art. 105 ao 109-C', 21, 3)
) AS t(title, fw, so)
CROSS JOIN (SELECT id FROM topics WHERE discipline_id = 'direito_constitucional' AND title = 'Constituição Estadual de Santa Catarina' AND parent_id IS NULL LIMIT 1) p
WHERE p.id IS NOT NULL;
