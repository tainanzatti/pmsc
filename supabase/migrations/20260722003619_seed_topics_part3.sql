/*
# Seed topics: Legislação Especial, Legislação de Trânsito, Redação

## Summary
Inserts topics for the final 3 disciplines.

## Topics
### Legislação Especial (10 topics)
### Legislação de Trânsito (7 topics - CTB article ranges)
### Redação (1 parent + 6 child topics)
*/

-- Legislação Especial
INSERT INTO topics (discipline_id, title, fibonacci_weight, sort_order) VALUES
  ('legislacao_especial', 'Lei dos Crimes Hediondos', 89, 1),
  ('legislacao_especial', 'Crimes de Racismo', 34, 2),
  ('legislacao_especial', 'Lei de Tortura', 34, 3),
  ('legislacao_especial', 'Organização Criminosa', 55, 4),
  ('legislacao_especial', 'Lei de Drogas', 89, 5),
  ('legislacao_especial', 'Abuso de Autoridade', 55, 6),
  ('legislacao_especial', 'Estatuto do Desarmamento', 55, 7),
  ('legislacao_especial', 'Lei Maria da Penha', 89, 8),
  ('legislacao_especial', 'Crimes do ECA', 34, 9),
  ('legislacao_especial', 'Estatuto do Idoso', 21, 10);

-- Legislação de Trânsito
INSERT INTO topics (discipline_id, title, fibonacci_weight, sort_order) VALUES
  ('legislacao_transito', 'CTB - Artigos 1 ao 4', 21, 1),
  ('legislacao_transito', 'CTB - Artigos 26 ao 67', 89, 2),
  ('legislacao_transito', 'CTB - Artigos 80 ao 90', 34, 3),
  ('legislacao_transito', 'CTB - Artigos 96 ao 102', 21, 4),
  ('legislacao_transito', 'CTB - Artigos 114 ao 160', 55, 5),
  ('legislacao_transito', 'CTB - Artigos 256 ao 279-A', 89, 6),
  ('legislacao_transito', 'CTB - Artigos 291 ao 312-B', 89, 7);

-- Redação: parent
INSERT INTO topics (discipline_id, title, fibonacci_weight, sort_order, parent_id)
VALUES
  ('redacao', 'Ordem Pública', 89, 1, NULL);

-- Redação: children
INSERT INTO topics (discipline_id, title, fibonacci_weight, sort_order, parent_id)
SELECT 'redacao', t.title, t.fw, t.so, p.id
FROM (VALUES
  ('Sistema de Justiça Criminal', 55, 1),
  ('Políticas Públicas de Ordem Pública', 34, 2),
  ('Ordem Pública na Constituição Federal', 34, 3),
  ('Competências das Polícias Militares', 55, 4),
  ('PM como força auxiliar e reserva do Exército', 21, 5),
  ('Hierarquia e disciplina', 34, 6)
) AS t(title, fw, so)
CROSS JOIN (SELECT id FROM topics WHERE discipline_id = 'redacao' AND title = 'Ordem Pública' AND parent_id IS NULL LIMIT 1) p
WHERE p.id IS NOT NULL;
