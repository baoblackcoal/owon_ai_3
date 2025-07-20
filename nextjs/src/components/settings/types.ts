import { z } from 'zod';

// 修改密码表单验证schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, "当前密码至少6位"),
  newPassword: z.string().min(6, "新密码至少6位"),
  confirmPassword: z.string().min(6, "确认密码至少6位"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "两次输入的新密码不一致",
  path: ["confirmPassword"],
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface UserChatInfo {
  chatCount: number;
  dailyLimit: number;
  remainingCount: number;
  isGuest: boolean;
}

export interface InstrumentSelectorProps {
  value: string;
  onChange: (value: string) => void;
} 