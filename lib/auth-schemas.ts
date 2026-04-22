import { z } from 'zod';

export const signInSchema = z.object({
  email: z.email('Keine gültige E-Mail-Adresse'),
  password: z.string().min(1, 'Passwort darf nicht leer sein'),
});

export const signUpSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben'),
  email: z.email('Keine gültige E-Mail-Adresse'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen haben'),
});

export type SignInFields = z.infer<typeof signInSchema>;
export type SignUpFields = z.infer<typeof signUpSchema>;
