import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { isValidInstrumentCombination } from '@/lib/instrument-config';
import type { CreateSupportTicketRequest, CreateSupportTicketResponse } from '@/types/support';

// 表单验证schema
const supportTicketSchema = z.object({
  company: z.string().optional(),
  lastName: z.string().min(1, '姓氏不能为空').max(30, '姓氏不能超过30个字符'),
  email: z.string().email('请输入有效的邮箱地址'),
  deviceType: z.string().min(1, '请选择设备类型'),
  deviceSeries: z.string().min(1, '请选择设备系列'),
  softwareVersion: z.string().min(1, '软件版本号不能为空').max(50, '软件版本号不能超过50个字符'),
  instrumentModel: z.string().min(1, '仪器型号不能为空').max(50, '仪器型号不能超过50个字符'),
  detail: z.string().min(1, '问题详情不能为空').max(1000, '问题详情不能超过1000个字符'),
}).refine((data) => isValidInstrumentCombination(data.deviceType, data.deviceSeries), {
  message: '设备类型和系列组合无效',
  path: ['deviceSeries'],
});

export async function POST(request: NextRequest): Promise<NextResponse<CreateSupportTicketResponse>> {
  try {
    const body = await request.json() as CreateSupportTicketRequest;
    
    // 表单验证
    const validationResult = supportTicketSchema.safeParse(body);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstError.message },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;
    
    // 获取Cloudflare环境和数据库
    const { env } = await getCloudflareContext();
    if (!env.DB) {
      return NextResponse.json(
        { success: false, error: '数据库连接失败' },
        { status: 500 }
      );
    }

    // 获取用户会话（如果已登录）
    const session = await auth();
    const userId = session?.user?.id || null;

    // 生成工单ID
    const ticketId = crypto.randomUUID();

    // 插入数据库
    const stmt = env.DB.prepare(`
      INSERT INTO support_tickets (
        id, user_id, company, last_name, email, 
        device_type, device_series, software_version, 
        instrument_model, detail, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    await stmt.bind(
      ticketId,
      userId,
      validatedData.company || null,
      validatedData.lastName,
      validatedData.email,
      validatedData.deviceType,
      validatedData.deviceSeries,
      validatedData.softwareVersion,
      validatedData.instrumentModel,
      validatedData.detail,
      Math.floor(Date.now() / 1000)
    ).run();

    return NextResponse.json(
      { success: true, ticketId },
      { status: 201 }
    );

  } catch (error) {
    console.error('Support ticket creation error:', error);
    return NextResponse.json(
      { success: false, error: '提交失败，请稍后重试' },
      { status: 500 }
    );
  }
} 