import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const familyId = searchParams.get('familyId');
    const memberId = searchParams.get('memberId');

    if (!familyId || !memberId) {
      return NextResponse.json({ success: false, error: '缺少参数' }, { status: 400 });
    }

    // 检查当前用户是否是管理员
    const member = db.prepare(`
      SELECT * FROM family_members WHERE family_id = ? AND user_id = ?
    `).get(familyId, user.id) as any;

    if (!member || member.role !== 'admin') {
      return NextResponse.json({ success: false, error: '只有管理员可以移除成员' }, { status: 403 });
    }

    // 不能移除自己
    if (Number(memberId) === user.id) {
      return NextResponse.json({ success: false, error: '不能移除自己' }, { status: 400 });
    }

    // 检查目标成员是否存在
    const targetMember = db.prepare(`
      SELECT * FROM family_members WHERE family_id = ? AND user_id = ?
    `).get(familyId, memberId) as any;

    if (!targetMember) {
      return NextResponse.json({ success: false, error: '成员不存在' }, { status: 404 });
    }

    // 不能移除创始人
    if (targetMember.role === 'founder') {
      return NextResponse.json({ success: false, error: '不能移除创始人' }, { status: 400 });
    }

    // 移除成员
    db.prepare(`
      DELETE FROM family_members WHERE family_id = ? AND user_id = ?
    `).run(familyId, memberId);

    // 清理成员的相关数据（可选：保留历史记录）
    // 这里可以添加清理其他关联数据的逻辑

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('移除成员失败:', error);
    return NextResponse.json({ success: false, error: '移除失败' }, { status: 500 });
  }
}

// 转让管理员
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
    }

    const { familyId, newAdminId } = await request.json();
    if (!familyId || !newAdminId) {
      return NextResponse.json({ success: false, error: '缺少参数' }, { status: 400 });
    }

    // 检查当前用户是否是管理员
    const member = db.prepare(`
      SELECT * FROM family_members WHERE family_id = ? AND user_id = ?
    `).get(familyId, user.id) as any;

    if (!member || (member.role !== 'admin' && member.role !== 'founder')) {
      return NextResponse.json({ success: false, error: '只有管理员或创始人可以转让管理员' }, { status: 403 });
    }

    // 不能转让给自己
    if (newAdminId === user.id) {
      return NextResponse.json({ success: false, error: '不能转让给自己' }, { status: 400 });
    }

    // 检查目标成员是否存在
    const targetMember = db.prepare(`
      SELECT * FROM family_members WHERE family_id = ? AND user_id = ?
    `).get(familyId, newAdminId) as any;

    if (!targetMember) {
      return NextResponse.json({ success: false, error: '目标成员不存在' }, { status: 404 });
    }

    // 开始事务
    const transaction = db.transaction(() => {
      // 将当前管理员降级为普通成员
      db.prepare(`
        UPDATE family_members SET role = 'member' WHERE family_id = ? AND user_id = ?
      `).run(familyId, user.id);

      // 将目标成员升级为管理员
      db.prepare(`
        UPDATE family_members SET role = 'admin' WHERE family_id = ? AND user_id = ?
      `).run(familyId, newAdminId);
    });

    transaction();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('转让管理员失败:', error);
    return NextResponse.json({ success: false, error: '转让失败' }, { status: 500 });
  }
}
