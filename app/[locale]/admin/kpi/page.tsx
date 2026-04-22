import { prisma } from '@/lib/prisma';
import { Shield, TrendingUp, Award, UserCheck } from 'lucide-react';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { redirect } from 'next/navigation';

export default async function KPIAdminPage() {
  const adminToken = (await cookies()).get('admin_token')?.value;
  if (!adminToken) redirect('/uz/admin-login');

  let role = 'ADMIN';
  try {
    const secret = new TextEncoder().encode(process.env.ADMIN_TOKEN_SECRET || 'daspay_secure_key_2026');
    const { payload } = await jwtVerify(adminToken, secret);
    role = payload.role as string;
  } catch (e) {
    redirect('/uz/admin-login');
  }

  // Fetch KPI data
  const userActions = await prisma.userAction.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 100, // recent 100 actions
  });

  // Calculate scores per user
  const scores: Record<number, { name: string, username: string, total: number }> = {};
  userActions.forEach(action => {
    if (!scores[action.userId]) {
      scores[action.userId] = { name: action.user.name || '', username: action.user.username, total: 0 };
    }
    scores[action.userId].total += action.points;
  });

  const leaderboard = Object.values(scores).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            Xodimlar Reytingi & KPI
          </h1>
          <p className="text-gray-500 mt-1">Ishchilar faoliyatini va ish unumdorligini nazorat qilish (Top 100 amallar)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leaderboard.map((user, index) => (
          <div key={user.username} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center relative overflow-hidden group hover:border-indigo-100 transition-colors">
            {index === 0 && (
              <div className="absolute top-0 right-0 p-4">
                <Award className="w-8 h-8 text-yellow-500 fill-yellow-50" />
              </div>
            )}
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
              <UserCheck className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{user.name || 'Xodim'}</h3>
            <p className="text-sm text-gray-500">@{user.username}</p>
            <div className="mt-4 pt-4 border-t border-gray-100 w-full text-center">
              <p className="text-sm text-gray-500">Jami to'plangan ball:</p>
              <p className="text-3xl font-black text-indigo-600">{user.total}</p>
            </div>
          </div>
        ))}

        {leaderboard.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-xl border border-gray-100 text-gray-500">
            Hali hech qanday harakat bajarilmagan.
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-8">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50">
          <h3 className="font-semibold text-gray-900">So'nggi harakatlar</h3>
        </div>
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-medium text-gray-900">Vaqt</th>
              <th className="px-6 py-4 font-medium text-gray-900">Xodim</th>
              <th className="px-6 py-4 font-medium text-gray-900">Harakat turi</th>
              <th className="px-6 py-4 font-medium text-gray-900">Ball</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {userActions.map(action => (
              <tr key={action.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-gray-500">{new Date(action.createdAt).toLocaleString('en-GB')}</td>
                <td className="px-6 py-4 font-medium">{action.user.username}</td>
                <td className="px-6 py-4">{action.description || action.actionType}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center justify-center min-w-[32px] h-8 px-2 rounded-lg font-bold ${
                    action.points < 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                  }`}>
                    {action.points > 0 ? '+' : ''}{action.points}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
