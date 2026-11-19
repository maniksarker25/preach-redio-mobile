/** Client-side checks mirroring the backend's validation (preach-radio-backend zod schemas). */
export const isEmail = (v: string) => /^\S+@\S+\.\S+$/.test(v.trim());

/** Backend minimum (`registerNormalUserValidationSchema`). */
export const MIN_PASSWORD = 6;
export const passwordError = (v: string) => (v.length < MIN_PASSWORD ? `Use at least ${MIN_PASSWORD} characters` : undefined);
