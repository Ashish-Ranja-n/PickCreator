import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongoose';
import { Deal } from '@/models/deal';
import { User } from '@/models';

export async function GET(request: NextRequest) {
  try {
    await connect();

    // Fetch all deals
    const deals = await Deal.find({}).lean();

    // Collect all unique user IDs (brands + influencers)
    const userIds = new Set<string>();
    deals.forEach((deal: any) => {
      if (deal.brandId) userIds.add(deal.brandId.toString());
      if (Array.isArray(deal.influencers)) {
        deal.influencers.forEach((inf: any) => {
          if (inf.id) userIds.add(inf.id.toString());
        });
      }
    });

    // Fetch all relevant users
    const users = await User.find({ _id: { $in: Array.from(userIds) } }).lean();
    const userMap: Record<string, any> = {};
    users.forEach((u: any) => { userMap[u._id.toString()] = u; });

    // Attach full user info to each deal (brand + influencers)
    const dealsWithUsers = deals.map((deal: any) => ({
      ...deal,
      brand: userMap[deal.brandId?.toString()] || null,
      influencers: Array.isArray(deal.influencers)
        ? deal.influencers.map((inf: any) => ({
            ...inf,
            user: userMap[inf.id?.toString()] || null
          }))
        : [],
    }));

    return NextResponse.json({ success: true, deals: dealsWithUsers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
