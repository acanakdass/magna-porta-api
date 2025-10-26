import { Injectable, NestMiddleware, Logger, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class IpFilterMiddleware implements NestMiddleware {
    private readonly logger = new Logger(IpFilterMiddleware.name);
    
    // Endpoints that should be excluded from IP filtering
    private readonly excludedEndpoints = [
        // '/health',
        // '/api/health',
        // '/webhook', // Webhook endpoints are typically called by external services
        // '/auth/login', // Allow login from any IP
        // '/auth/register', // Allow registration from any IP
        // '/docs', // API documentation
        // '/swagger', // Swagger UI
    ];


    async use(req: Request, res: Response, next: NextFunction) {
        // Check if IP filtering is enabled
        if (!this.isIpFilterEnabled()) {
            this.logger.debug('IP filtering is disabled. Allowing all requests.');
            return next();
        }
console.log('Ip Filter Middleware is running: isactive'+this.isIpFilterEnabled()+' '+process.env.IP_FILTER_ENABLED);
        // Check if the endpoint should be excluded from IP filtering
        if (this.isExcludedEndpoint(req.originalUrl)) {
            return next();
        }

        // Get allowed IPs from environment variable
        const allowedIPs = this.getAllowedIPs();
        
        // If no IPs are configured, allow all requests
        if (allowedIPs.length === 0) {
            this.logger.warn('No allowed IPs configured. Allowing all requests.');
            return next();
        }

        // Get client IP
        const clientIP = this.getClientIP(req);
        console.log('Client IP: '+clientIP);
        console.log('Allowed IPs: '+allowedIPs);
        // Check if client IP is in allowed list
        if (!this.isIPAllowed(clientIP, allowedIPs)) {
            this.logger.warn(`Blocked request from IP: ${clientIP} to ${req.originalUrl}`);
            throw new ForbiddenException(`Access denied from IP: ${clientIP}`);
        }

        this.logger.debug(`Allowed request from IP: ${clientIP} to ${req.originalUrl}`);
        next();
    }

    private isIpFilterEnabled(): boolean {
        const enabled = process.env.IP_FILTER_ENABLED;
        
        // Default to false (disabled) if not set
        if (!enabled) {
            return false;
        }
        
        // Check for various "true" values
        return enabled.toLowerCase() === 'true' || 
               enabled === '1' || 
               enabled.toLowerCase() === 'yes' ||
               enabled.toLowerCase() === 'on';
    }

    private isExcludedEndpoint(url: string): boolean {
        return this.excludedEndpoints.some(endpoint => 
            url.startsWith(endpoint)
        );
    }

    private getAllowedIPs(): string[] {
        const allowedIPsEnv = process.env.ALLOWED_IPS;
        console.log('Allowed IPs: '+allowedIPsEnv);
        if (!allowedIPsEnv) {
            return [];
        }

        console.log('Allowed IPs: '+allowedIPsEnv.split(',').map(ip => ip.trim()).filter(ip => ip.length > 0));
        // Split by comma and trim whitespace
        return allowedIPsEnv.split(',').map(ip => ip.trim()).filter(ip => ip.length > 0);
    }

    private getClientIP(req: Request): string {
        // Check for IP in various headers (for cases behind proxies/load balancers)
        const forwardedFor = req.headers['x-forwarded-for'] as string;
        const realIP = req.headers['x-real-ip'] as string;
        const cfConnectingIP = req.headers['cf-connecting-ip'] as string;
        
        // If x-forwarded-for exists, take the first IP (original client)
        if (forwardedFor) {
            return forwardedFor.split(',')[0].trim();
        }
        
        // Check other headers
        if (realIP) {
            return realIP;
        }
        
        if (cfConnectingIP) {
            return cfConnectingIP;
        }
        
        // Fallback to connection remote address
        return req.connection?.remoteAddress || req.socket?.remoteAddress || req.ip || 'unknown';
    }

    private isIPAllowed(clientIP: string, allowedIPs: string[]): boolean {
        // Handle IPv6 localhost
        if (clientIP === '::1' || clientIP === '::ffff:127.0.0.1') {
            clientIP = '127.0.0.1';
        }

        // Check exact match first
        if (allowedIPs.includes(clientIP)) {
            return true;
        }

        // Check for CIDR notation support (basic implementation)
        for (const allowedIP of allowedIPs) {
            if (this.isIPInCIDR(clientIP, allowedIP)) {
                return true;
            }
        }

        return false;
    }

    private isIPInCIDR(ip: string, cidr: string): boolean {
        // Basic CIDR support for common cases
        if (!cidr.includes('/')) {
            return false; // Not a CIDR notation
        }

        try {
            const [network, prefixLength] = cidr.split('/');
            const prefix = parseInt(prefixLength, 10);
            
            // Convert IPs to binary representation for comparison
            const ipBinary = this.ipToBinary(ip);
            const networkBinary = this.ipToBinary(network);
            
            if (!ipBinary || !networkBinary) {
                return false;
            }
            
            // Compare the network portion
            const networkBits = ipBinary.substring(0, prefix);
            const allowedNetworkBits = networkBinary.substring(0, prefix);
            
            return networkBits === allowedNetworkBits;
        } catch (error) {
            this.logger.warn(`Invalid CIDR notation: ${cidr}`);
            return false;
        }
    }

    private ipToBinary(ip: string): string | null {
        try {
            // Handle IPv4
            if (ip.includes('.')) {
                return ip.split('.').map(octet => 
                    parseInt(octet, 10).toString(2).padStart(8, '0')
                ).join('');
            }
            
            // Handle IPv6 (basic implementation)
            if (ip.includes(':')) {
                // This is a simplified IPv6 to binary conversion
                // For production, consider using a proper IPv6 library
                return null;
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }
}
