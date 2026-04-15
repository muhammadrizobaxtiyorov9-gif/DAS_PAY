import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: 'daspay_client_token',
    value: '',
    httpOnly: true,
    maxAge: 0,
    path: '/',
  });
  return response;
}
