import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type UserRol = 'admin' | 'mozo' | 'cocina' | 'ayudante_cocina' | 'lavaplato';

const ROLE_PREFIX: Record<UserRol, string> = {
  admin: '/admin',
  mozo: '/mozo',
  cocina: '/cocina',
  ayudante_cocina: '/cocina',
  lavaplato: '/cocina',
};

const ROLE_HOME: Record<UserRol, string> = {
  admin: '/admin/dashboard',
  mozo: '/mozo',
  cocina: '/cocina',
  ayudante_cocina: '/cocina',
  lavaplato: '/cocina',
};

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url, key, ok: Boolean(url && key) };
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const { url, key, ok } = getSupabaseEnv();

  const isPublicAuth =
    pathname === '/' ||
    pathname.startsWith('/login-admin') ||
    pathname.startsWith('/login-mozo') ||
    pathname.startsWith('/login-cocina') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/registro-admin');

  if (!ok) {
    if (isPublicAuth) {
      return NextResponse.next();
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/';
    loginUrl.searchParams.set('error', 'config');
    return NextResponse.redirect(loginUrl);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    url!,
    key!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (isPublicAuth) {
    if (user && (pathname === '/' || pathname.startsWith('/login'))) {
      const rol = user.user_metadata?.rol as UserRol | undefined;
      if (rol && ROLE_HOME[rol]) {
        return NextResponse.redirect(new URL(ROLE_HOME[rol], request.url));
      }
    }
    return supabaseResponse;
  }

  const isProtected =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/mozo') ||
    pathname.startsWith('/cocina');

  if (!isProtected) return supabaseResponse;

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  const rol = user.user_metadata?.rol as UserRol | undefined;
  if (!rol) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  const allowedPrefix = ROLE_PREFIX[rol];
  if (!pathname.startsWith(allowedPrefix)) {
    return NextResponse.redirect(new URL(ROLE_HOME[rol], request.url));
  }

  return supabaseResponse;
}
