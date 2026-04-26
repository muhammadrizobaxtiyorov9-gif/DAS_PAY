import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = '/uz/admin-login'; // Default to uz or extract from referer/cookies if needed
  
  const response = NextResponse.redirect(url);
  response.cookies.set({
    name: 'admin_token',
    value: '',
    httpOnly: true,
    maxAge: 0,
    path: '/',
  });
  
  return response;
}

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: 'admin_token',
    value: '',
    httpOnly: true,
    maxAge: 0,
    path: '/',
  });
  return response;
}
