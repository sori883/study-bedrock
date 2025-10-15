import z from "zod";

export const schema = z.object({
  content: z
  .coerce
  .string()
  .min(100, "100文字以上で入力してください。")
  .max(5000, "5000文字以内で入力してください")
});
