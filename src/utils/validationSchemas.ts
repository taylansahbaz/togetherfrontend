import { z } from "zod";

const emailSchema = z
    .string({ required_error: "E-posta alanı boş bırakılamaz." })
    .trim()
    .min(1, "E-posta alanı boş bırakılamaz.")
    .email("Lütfen geçerli bir e-posta adresi giriniz.");

const nameSchema = z
    .string({ required_error: "İsim alanı boş bırakılamaz." })
    .trim()
    .min(2, "İsim en az 2 karakter olmalıdır.");

const strongPasswordSchema = z
    .string({ required_error: "Şifre alanı boş bırakılamaz." })
    .min(6, "Şifreniz en az 6 karakter olmalıdır.")
    .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.,#]).{6,}$/,
        "Şifreniz büyük harf, küçük harf, rakam ve özel karakter (., !, vs.) içermelidir."
    );

const simplePasswordSchema = z
    .string({ required_error: "Şifre alanı boş bırakılamaz." })
    .min(1, "Şifre alanı boş bırakılamaz.");

export const registerSchema = z.object({
    name: nameSchema,
    email: emailSchema,
    password: strongPasswordSchema,
});
export type RegisterFormData = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
    email: emailSchema,
    password: simplePasswordSchema,
});
export type LoginFormData = z.infer<typeof loginSchema>;

export const resetPasswordRequestSchema = z.object({
    email: emailSchema,
});
export type ResetPasswordRequestFormData = z.infer<
    typeof resetPasswordRequestSchema
>;

export const resetPasswordSchema = z
    .object({
        code: z
            .string({ required_error: "Doğrulama kodu gerekli." })
            .trim()
            .min(4, "Kod en az 4 karakter olmalıdır."),
        password: strongPasswordSchema,
        confirmPassword: z.string({
            required_error: "Şifreyi tekrar girmelisiniz.",
        }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Şifreler eşleşmiyor.",
        path: ["confirmPassword"],
    });
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const createGroupSchema = z.object({
    name: z
        .string({ required_error: "Grup adı gerekli." })
        .trim()
        .min(2, "Grup adı en az 2 karakter olmalıdır.")
        .max(50, "Grup adı en fazla 50 karakter olabilir."),
    description: z
        .string()
        .trim()
        .max(300, "Açıklama en fazla 300 karakter olabilir.")
        .optional()
        .or(z.literal("")),
});
export type CreateGroupFormData = z.infer<typeof createGroupSchema>;

export const createPlaceSchema = z.object({
    name: z
        .string({ required_error: "Mekan adı gerekli." })
        .trim()
        .min(2, "Mekan adı en az 2 karakter olmalıdır.")
        .max(80, "Mekan adı en fazla 80 karakter olabilir."),
    address: z
        .string()
        .trim()
        .max(200, "Adres en fazla 200 karakter olabilir.")
        .optional()
        .or(z.literal("")),
    category: z
        .string({ required_error: "Kategori seçmelisiniz." })
        .min(1, "Kategori seçmelisiniz."),
    description: z
        .string()
        .trim()
        .max(500, "Açıklama en fazla 500 karakter olabilir.")
        .optional()
        .or(z.literal("")),
});
export type CreatePlaceFormData = z.infer<typeof createPlaceSchema>;
