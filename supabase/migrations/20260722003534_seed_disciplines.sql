/*
# Seed PMSC-AOCP disciplines

## Summary
Inserts the 10 official disciplines for the PMSC Soldado 2026 exam (Instituto AOCP)
with their question counts and display metadata.

## Disciplines (in sort order)
1. Língua Portuguesa (8 questions)
2. Informática (5 questions)
3. Legislação Institucional (10 questions)
4. Direito Constitucional (8 questions)
5. Direito Penal Comum (6 questions)
6. Direito Processual Penal Comum (6 questions)
7. Direito Penal Militar (6 questions)
8. Legislação Especial (6 questions)
9. Legislação de Trânsito (5 questions)
10. Redação (discursive, 0 objective questions)
*/

INSERT INTO disciplines (id, name, icon, color, question_count, sort_order, is_discursive) VALUES
  ('lingua_portuguesa', 'Língua Portuguesa', '📖', '#3b82f6', 8, 1, false),
  ('informatica', 'Informática', '💻', '#06b6d4', 5, 2, false),
  ('legislacao_institucional', 'Legislação Institucional', '🏛️', '#f97316', 10, 3, false),
  ('direito_constitucional', 'Direito Constitucional', '⚖️', '#8b5cf6', 8, 4, false),
  ('direito_penal_comum', 'Direito Penal Comum', '🔒', '#ef4444', 6, 5, false),
  ('direito_processual_penal_comum', 'Direito Processual Penal Comum', '📋', '#f59e0b', 6, 6, false),
  ('direito_penal_militar', 'Direito Penal Militar', '🎖️', '#dc2626', 6, 7, false),
  ('legislacao_especial', 'Legislação Especial', '📚', '#22c55e', 6, 8, false),
  ('legislacao_transito', 'Legislação de Trânsito', '🚗', '#14b8a6', 5, 9, false),
  ('redacao', 'Redação (Discursiva)', '✍️', '#ec4899', 0, 10, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  question_count = EXCLUDED.question_count,
  sort_order = EXCLUDED.sort_order,
  is_discursive = EXCLUDED.is_discursive;
