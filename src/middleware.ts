import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { routing } from "@/i18n/routing";

const DEMO_COOKIE = "spendflow_demo_session";

const handleI18n = createMiddleware(routing);

function isDemoModeEnv() {
  if (process.env.DEMO_MODE === "true") return true;
  if (process.env.DEMO_MODE === "false") return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return !url || !key;
}

function stripLocale(pathname: string) {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}`) return "/";
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1) || "/";
    }
  }
  return pathname;
}

function localeFromPath(pathname: string) {
  const segment = pathname.split("/")[1];
  return routing.locales.includes(segment as (typeof routing.locales)[number])
    ? segment
    : routing.defaultLocale;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locale = localeFromPath(pathname);
  const pathWithoutLocale = stripLocale(pathname);
  const isProtected =
    pathWithoutLocale.startsWith("/employee") ||
    pathWithoutLocale.startsWith("/admin");

  if (!isProtected) {
    return handleI18n(request);
  }

  if (isDemoModeEnv()) {
    const demoSession = request.cookies.get(DEMO_COOKIE)?.value;
    if (!demoSession) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      url.searchParams.set("next", pathWithoutLocale);
      return NextResponse.redirect(url);
    }
    if (
      pathWithoutLocale.startsWith("/admin") &&
      demoSession !== "e-admin"
    ) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/employee/subscriptions`;
      return NextResponse.redirect(url);
    }
    return handleI18n(request);
  }

  let response = handleI18n(request);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = handleI18n(request);
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([header, value]) => {
          response.headers.set(header, value);
        });
      },
    },
  });

  // Must run immediately after createServerClient so token refresh cookies
  // land on `response` before we return or redirect.
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims.sub) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `/${locale}/login`;
    loginUrl.searchParams.set("next", pathWithoutLocale);
    const redirect = NextResponse.redirect(loginUrl);
    // Preserve any cookie writes from a failed/partial refresh.
    response.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie.name, cookie.value);
    });
    for (const header of ["Cache-Control", "Expires", "Pragma"] as const) {
      const value = response.headers.get(header);
      if (value) redirect.headers.set(header, value);
    }
    return redirect;
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|auth|_next|_vercel|.*\\..*).*)"],
};
