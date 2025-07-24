// 支持工单相关类型定义

interface SupportTicketFormData {
  company?: string;        // 公司名称（选填）
  lastName: string;        // 姓氏（必填）
  email: string;          // 邮箱（必填）
  deviceType: string;     // 设备类型（必填）
  deviceSeries: string;   // 设备系列（必填）
  softwareVersion: string; // 软件版本号（必填）
  instrumentModel: string; // 仪器型号（必填）
  detail: string;         // 问题详情（必填）
}

export interface SupportTicketData extends SupportTicketFormData {
  id: string;
  userId?: string;        // 用户ID（如果已登录）
  createdAt: number;      // 创建时间戳
}

export interface CreateSupportTicketRequest {
  company?: string;
  lastName: string;
  email: string;
  deviceType: string;
  deviceSeries: string;
  softwareVersion: string;
  instrumentModel: string;
  detail: string;
}

export interface CreateSupportTicketResponse {
  success: boolean;
  error?: string;
  ticketId?: string;
} 