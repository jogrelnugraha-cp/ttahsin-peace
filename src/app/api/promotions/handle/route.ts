import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { revalidatePath } from 'next/cache';

async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map(({ name, value }) => ({ name, value }));
        },
        setAll() {
          /* no-op */
        },
      },
    }
  );
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const { id, action } = body as { id?: string; action?: 'approve' | 'reject' };
    if (!id || !action) return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });

    // fetch promotion record using admin key
    const { data: promo, error: pErr } = await supabaseAdmin
      .from('level_promotions')
      .select('id, student_id, guru_id, category, target_level')
      .eq('id', id)
      .maybeSingle();

    if (pErr) return NextResponse.json({ success: false, error: pErr.message }, { status: 500 });
    if (!promo) return NextResponse.json({ success: false, error: 'Promotion not found' }, { status: 404 });

    // only the guru_id (approver) may approve/reject
    if (user.id !== promo.guru_id) return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });

    if (action === 'reject') {
      const { error: rejErr } = await supabaseAdmin
        .from('level_promotions')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', id);
      if (rejErr) return NextResponse.json({ success: false, error: rejErr.message }, { status: 500 });
      revalidatePath('/dashboard/guru');
      revalidatePath('/dashboard/admin/approvals');
      revalidatePath('/dashboard/guru/promotions');
      return NextResponse.json({ success: true });
    }

    // action === 'approve'
    const { error: updErr } = await supabaseAdmin
      .from('level_promotions')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updErr) return NextResponse.json({ success: false, error: updErr.message }, { status: 500 });

    // update student profile according to category
    const studentId = promo.student_id as string;
    const category = String(promo.category || 'tahsin').toLowerCase();
    const targetLevel = promo.target_level;

    if (category === 'tahfidz') {
      const { error: profErr } = await supabaseAdmin
        .from('profiles')
        .update({ tahfidz_level: targetLevel, pembimbing_id: user.id, teacher_id: user.id, updated_at: new Date().toISOString() })
        .eq('id', studentId);
      if (profErr) return NextResponse.json({ success: false, error: profErr.message }, { status: 500 });
    } else {
      const { error: profErr } = await supabaseAdmin
        .from('profiles')
        .update({ tahsin_level: targetLevel, pembimbing_id: user.id, teacher_id: user.id, updated_at: new Date().toISOString() })
        .eq('id', studentId);
      if (profErr) return NextResponse.json({ success: false, error: profErr.message }, { status: 500 });
    }

    // revalidate pages
    revalidatePath('/dashboard/guru');
    revalidatePath('/dashboard/admin/approvals');
    revalidatePath('/dashboard/guru/promotions');

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
