import { NextResponse, NextRequest } from "next/server";
import { getDataFromToken } from "./helpers/getDataFromToken";

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const token = request.cookies.get('token')?.value || '';

    // Get the base URL from environment variables
    const baseUrl = process.env.CLIENT_URL || 'https://pickcreator.com';

    // Redirect all /log-in and /sign-up requests to /welcome
    if (path.startsWith('/log-in') || path.startsWith('/sign-up')) {
        return NextResponse.redirect(`${baseUrl}/welcome`);
    }

    if (path.startsWith('/verify-instagram')) {
        if (!token) {
            return NextResponse.redirect(`${baseUrl}/welcome`);
        }
        try {
            const payload = await getDataFromToken(request, token);

            if (payload?.role === 'Influencer' && payload?.isInstagramVerified) {
                return NextResponse.redirect(`${baseUrl}/influencer/profile`);
            }
        } catch (error: any) {
            console.error("Token verification failed:", error.message);
            const response = NextResponse.redirect(`${baseUrl}/welcome`);
            response.cookies.delete('token');
            return response;
        }
    }

    // Handle API routes
    if(path.startsWith('/api/')) {
        // Define public API routes that don't need authentication
        const publicApiRoutes = [
            '/api/auth/otp-login',
            '/api/auth/sign-up',
            '/api/auth/log-in',
            '/api/auth/instagram',
            '/api/instagram/webhook',
            '/api/auth/check-auth',
            '/api/auth/refresh-token',
            '/api/cron/update-instagram-data',
            '/api/auth/checkDatabase',
            '/api/analytics',
            '/api/faqs',
            '/api/contact',
            '/api/auth/forgot-password',
            '/api/auth/reset-password',
            '/api/verify-otp',
            '/api/send-otp',
            '/api/payments/callback',
            '/api/notifications/send',
            '/api/notifications/subscribe',
            '/api/notifications/unsubscribe',
            '/api/notifications/vapid-public-key',
            '/api/auth/google/callback',
            '/api/auth/google'
        ];

        // Check if the current path is a public API route
        if(publicApiRoutes.some(route => path.startsWith(route))) {
            return NextResponse.next();
        }

        // For all other API routes, verify token
        if(!token) {
            return NextResponse.json({ error: "Unauthorized - Authentication required" }, { status: 401 });
        }

        try {
            const payload = await getDataFromToken(request, token);
            if(!payload) {
                return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 });
            }

            // Token is valid, proceed with the request
            return NextResponse.next();
        } catch (error: any) {
            console.error("API authentication error:", error.message);
            return NextResponse.json({ error: "Unauthorized - Authentication failed" }, { status: 401 });
        }
    }

    // Handle public onboarding routes - no token needed
    if(path.startsWith('/welcome') || path.startsWith('/pickRole') || path === '/') {
        if(token) {
            try {
                const payload = await getDataFromToken(request, token);
                const role = payload?.role;

                // If user has a valid role and tries to access /pickRole, redirect to their respective dashboard
                if (role !== 'needed' && path.startsWith('/pickRole')) {
                    if (role === 'Brand') {
                        return NextResponse.redirect(`${baseUrl}/brand`);
                    }
                    if (role === 'Influencer') {
                        return NextResponse.redirect(`${baseUrl}/influencer`);
                    }
                    if (role === 'Admin') {
                        return NextResponse.redirect(`${baseUrl}/admin`);
                    }
                }

                if(role === 'needed' && !path.startsWith('/pickRole')) {
                    return NextResponse.redirect(`${baseUrl}/pickRole`);
                }
                if(role === 'Brand') {
                    return NextResponse.redirect(`${baseUrl}/brand`);
                }
                if(role === 'Influencer') {
                    return NextResponse.redirect(`${baseUrl}/influencer`);
                }
                if(role === 'Admin') {
                    return NextResponse.redirect(`${baseUrl}/admin`);
                }
            } catch (error: any) {
                // If token verification fails, clear the token and stay on onboarding page
                const response = NextResponse.next();
                response.cookies.delete('token');
                return response;
            }
        }
        return NextResponse.next();
    }
   

    // For protected routes, verify token
    if(path.startsWith('/brand') || path.startsWith('/influencer') || path.startsWith('/admin')) {
        if(!token) {
            return NextResponse.redirect(`${baseUrl}/welcome`);
        }

        try {
            const payload = await getDataFromToken(request, token);
            const role = payload?.role;
            const onboardingCompleted = payload?.onboardingCompleted;

            if(role === 'needed') {
                return NextResponse.redirect(`${baseUrl}/pickRole`);
            }

            // Influencer onboarding check
            if (path.startsWith('/influencer') && role === 'Influencer' && onboardingCompleted === false && !path.startsWith('/influencer/onboarding')) {
                return NextResponse.redirect(`${baseUrl}/influencer/onboarding/basic-info`);
            }

            // Role-based access control
            if(path.startsWith('/brand') && role !== 'Brand') {
                if(role === 'Admin') {
                    return NextResponse.redirect(`${baseUrl}/admin`);
                }
                return NextResponse.redirect(`${baseUrl}/influencer`);
            }

            if(path.startsWith('/influencer') && role !== 'Influencer') {
                if(role === 'Admin') {
                    return NextResponse.redirect(`${baseUrl}/admin`);
                }
                return NextResponse.redirect(`${baseUrl}/brand`);
            }

            if(path.startsWith('/admin') && role !== 'Admin') {
                if(role === 'Brand') {
                    return NextResponse.redirect(`${baseUrl}/brand`);
                }
                return NextResponse.redirect(`${baseUrl}/influencer`);
            }

            return NextResponse.next();
        } catch (error: any) {
            // Token is invalid or expired - redirect to login page
            console.error("Token verification failed:", error.message);
            const response = NextResponse.redirect(`${baseUrl}/welcome`);
            response.cookies.delete('token');
            return response;
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/',
        '/verify-instagram',
        '/pickRole',
        '/welcome',
        '/pickRole/:path*',
        '/welcome/:path*',
        '/log-in/:path*',
        '/sign-up/:path*',
        '/brand/:path*',
        '/influencer/:path*',
        '/connect-instagram',
        '/admin/:path*',
        '/api/:path*'
    ]
};