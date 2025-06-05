import { NextResponse, NextRequest } from "next/server";
import { getDataFromToken } from "./helpers/getDataFromToken";

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const token = request.cookies.get('token')?.value || '';

    // Get the base URL from environment variables
    const baseUrl = process.env.CLIENT_URL || 'https://pickcreator.com';

    // Handle API routes
    if(path.startsWith('/api/')) {
        // Define public API routes that don't need authentication
        const publicApiRoutes = [
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
            '/api/notifications/vapid-public-key'
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

    // Handle authentication routes - no token needed
    if(path.startsWith('/log-in') || path.startsWith('/sign-up') || path === '/') {
        if(token) {
            try {
                const payload = await getDataFromToken(request, token);
                const role = payload?.role;

                if(role === 'Brand') {
                    return NextResponse.redirect(`${baseUrl}/brand`);
                }
                if(role === 'Influencer') {
                    // Middleware will handle the redirect to connect-instagram page if needed
                    return NextResponse.redirect(`${baseUrl}/influencer`);
                }
                if(role === 'Admin') {
                    return NextResponse.redirect(`${baseUrl}/admin`);
                }
            } catch (error: any) {
                // If token verification fails, clear the token and stay on login page
                const response = NextResponse.next();
                response.cookies.delete('token');
                return response;
            }
        }
        return NextResponse.next();
    }

    // Special case for Instagram connection page - accessible for influencers
    if(path === '/connect-instagram') {
        if(!token) {
            return NextResponse.redirect(`${baseUrl}/log-in`);
        }

        try {
            const payload = await getDataFromToken(request, token);
            const role = payload?.role;
            const instagramConnected = payload?.instagramConnected === true;

            // Only influencers can access this page
            if(role !== 'Influencer') {
                if(role === 'Brand') {
                    return NextResponse.redirect(`${baseUrl}/brand`);
                }
                if(role === 'Admin') {
                    return NextResponse.redirect(`${baseUrl}/admin`);
                }
                return NextResponse.redirect(`${baseUrl}/log-in`);
            }
            if(role === 'Influencer' && instagramConnected) {
                return NextResponse.redirect(`${baseUrl}/influencer`);
            }

            return NextResponse.next();
        } catch (error: any) {
            // Token is invalid or expired - redirect to login page
            console.error("Token verification failed:", error.message);
            const response = NextResponse.redirect(`${baseUrl}/log-in`);
            response.cookies.delete('token');
            return response;
        }
    }

    // For protected routes, verify token
    if(path.startsWith('/brand') || path.startsWith('/influencer') || path.startsWith('/admin')) {
        if(!token) {
            return NextResponse.redirect(`${baseUrl}/log-in`);
        }

        try {
            const payload = await getDataFromToken(request, token);
            const role = payload?.role;

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

            // Check Instagram connection for influencers
            // We can now do this directly from the token without database queries
            if(path.startsWith('/influencer') && role === 'Influencer') {
                // Skip this check for the onboarding paths
                if(!path.includes('/onboarding') && !path.includes('/connect-instagram')) {
                    // Check if Instagram is connected using the token data
                    const instagramConnected = payload?.instagramConnected === true;

                    if(!instagramConnected) {
                        console.log("Middleware: Instagram not connected, redirecting to connect-instagram");
                        return NextResponse.redirect(`${baseUrl}/connect-instagram`);
                    }
                }
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
            const response = NextResponse.redirect(`${baseUrl}/log-in`);
            response.cookies.delete('token');
            return response;
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/',
        '/log-in/:path*',
        '/sign-up/:path*',
        '/brand/:path*',
        '/influencer/:path*',
        '/connect-instagram',
        '/admin/:path*',
        '/api/:path*'
    ]
};