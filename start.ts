import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Informe seu email').email('Email inválido'),
  password: z.string().min(1, 'Informe sua senha'),
})
export type LoginFormData = z.infer<typeof loginSchema>

// Valida CPF (dígitos verificadores)
function isValidCPF(raw: string): boolean {
  const cpf = raw.replace(/\D/g, '')
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i)
  let check = (sum * 10) % 11
  if (check === 10) check = 0
  if (check !== parseInt(cpf[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i)
  check = (sum * 10) % 11
  if (check === 10) check = 0
  if (check !== parseInt(cpf[10])) return false

  return true
}

export const signupSchema = z
  .object({
    fullName: z.string().trim().min(3, 'Informe seu nome completo'),
    dateOfBirth: z.string().min(1, 'Informe sua data de nascimento'),
    cpf: z.string().refine(isValidCPF, 'CPF inválido'),
    email: z.string().min(1, 'Informe seu email').email('Email inválido'),
    password: z.string().min(6, 'A senha precisa ter ao menos 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme sua senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não correspondem',
    path: ['confirmPassword'],
  })
export type SignupFormData = z.infer<typeof signupSchema>

export const resetPasswordSchema = z.object({
  email: z.string().min(1, 'Informe seu email').email('Email inválido'),
})
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
