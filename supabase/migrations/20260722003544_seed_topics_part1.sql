/*
# Seed topics: Língua Portuguesa, Informática, Legislação Institucional

## Summary
Inserts all edital topics for the first 3 disciplines with Fibonacci weights
based on AOCP historical incidence.

## Topics
### Língua Portuguesa (11 topics)
### Informática (15 topics)
### Legislação Institucional (8 topics)

## Fibonacci weights used:
- 89 = extremamente cobrado
- 55 = muito cobrado
- 34 = bastante cobrado
- 21 = cobrado com frequência
- 13 = importância média
- 8 = média
- 5 = baixa
- 3 = muito baixa
- 2 = rara
- 1 = quase nunca cobrado
*/

-- Língua Portuguesa
INSERT INTO topics (discipline_id, title, fibonacci_weight, sort_order) VALUES
  ('lingua_portuguesa', 'Compreensão e interpretação de textos', 89, 1),
  ('lingua_portuguesa', 'Tipologia textual', 34, 2),
  ('lingua_portuguesa', 'Ortografia oficial', 21, 3),
  ('lingua_portuguesa', 'Acentuação gráfica', 21, 4),
  ('lingua_portuguesa', 'Emprego das classes de palavras', 34, 5),
  ('lingua_portuguesa', 'Emprego do sinal indicativo de crase', 21, 6),
  ('lingua_portuguesa', 'Sintaxe da oração e do período', 55, 7),
  ('lingua_portuguesa', 'Pontuação', 34, 8),
  ('lingua_portuguesa', 'Concordância nominal e verbal', 55, 9),
  ('lingua_portuguesa', 'Regências nominal e verbal', 34, 10),
  ('lingua_portuguesa', 'Significação das palavras', 21, 11);

-- Informática
INSERT INTO topics (discipline_id, title, fibonacci_weight, sort_order) VALUES
  ('informatica', 'Internet', 34, 1),
  ('informatica', 'Intranet', 13, 2),
  ('informatica', 'Tecnologias e ferramentas de informática', 21, 3),
  ('informatica', 'LibreOffice Writer', 55, 4),
  ('informatica', 'LibreOffice Calc', 55, 5),
  ('informatica', 'LibreOffice Impress', 21, 6),
  ('informatica', 'Windows 11', 34, 7),
  ('informatica', 'Ferramentas em nuvem', 21, 8),
  ('informatica', 'LGPD', 34, 9),
  ('informatica', 'Navegação na internet', 21, 10),
  ('informatica', 'Correio eletrônico', 21, 11),
  ('informatica', 'Segurança da informação', 55, 12),
  ('informatica', 'Vírus', 34, 13),
  ('informatica', 'Worms', 13, 14),
  ('informatica', 'Malwares', 34, 15);

-- Legislação Institucional
INSERT INTO topics (discipline_id, title, fibonacci_weight, sort_order) VALUES
  ('legislacao_institucional', 'Estatuto dos Policiais Militares (Lei 6.218/1983)', 89, 1),
  ('legislacao_institucional', 'Regulamento Disciplinar da PMSC (Decreto 12.112/1980)', 89, 2),
  ('legislacao_institucional', 'Lei Orgânica Nacional das PMs (Lei 14.751/2023)', 55, 3),
  ('legislacao_institucional', 'LC 587/2013', 34, 4),
  ('legislacao_institucional', 'LC 801/2022', 34, 5),
  ('legislacao_institucional', 'LC 765/2020', 21, 6),
  ('legislacao_institucional', 'Decreto 1.601/2021', 21, 7),
  ('legislacao_institucional', 'Lei Estadual 5.209/1976', 13, 8);
