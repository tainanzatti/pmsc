/*
# Seed topics: Direito Constitucional (hierarchical)

## Summary
Inserts topics for Direito Constitucional with hierarchical structure.
Parent topics: Constituição Federal, Constituição Estadual de Santa Catarina
Child topics: specific article ranges under each parent.

## Fibonacci weights
Constituição Federal arts. 37-42 (administração pública) = 89 (extremamente cobrado)
Constituição Federal arts. 1-6 (fundamentos) = 55
Constituição Estadual arts. 1-40 = 34
*/

-- Parent topics first
INSERT INTO topics (discipline_id, title, fibonacci_weight, sort_order, parent_id)
VALUES
  ('direito_constitucional', 'Constituição Federal', 89, 1, NULL),
  ('direito_constitucional', 'Constituição Estadual de Santa Catarina', 34, 2, NULL)
RETURNING id, title;
