"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUserSchema = void 0;
const zod_1 = require("zod");
exports.registerUserSchema = zod_1.z
    .object({
    firstName: zod_1.z.string().min(1, "Name is required"),
    //   lastName: z.string().min(1, "Last Name is required"),
    email: zod_1.z.email("Invalid email address"),
    password: zod_1.z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: zod_1.z
        .string()
        .min(8, "Confirm Password must be at least 8 characters long"),
})
    .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
});
//# sourceMappingURL=authValidation.schema.js.map