// ResQ Kenya - Error Handling & Logging Service
// Centralized error management, logging, and monitoring

import { Platform } from 'react-native';
import { doc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

// Error severity levels
export type ErrorSeverity = 'debug' | 'info' | 'warning' | 'error' | 'critical';

// Error categories
export type ErrorCategory =
    | 'auth'           // Authentication errors
    | 'network'        // Network/connectivity issues
    | 'payment'        // Payment processing errors
    | 'location'       // GPS/location errors
    | 'firebase'       // Firestore/Firebase errors
    | 'api'            // API/Cloud Function errors
    | 'validation'     // Input validation errors
    | 'permission'     // Permission denied errors
    | 'ui'             // UI/rendering errors
    | 'unknown';       // Uncategorized errors

interface LogEntry {
    timestamp: Date;
    severity: ErrorSeverity;
    category: ErrorCategory;
    message: string;
    context?: Record<string, any>;
    userId?: string;
    sessionId?: string;
    platform: string;
    appVersion: string;
    stackTrace?: string;
}

// Configuration
const CONFIG = {
    LOG_TO_CONSOLE: __DEV__, // Only in development
    LOG_TO_FIREBASE: true,   // Log critical errors to Firebase
    MIN_SEVERITY_FOR_FIREBASE: 'error' as ErrorSeverity,
    APP_VERSION: '1.0.0',
    SESSION_ID: `session_${Date.now()}`,
};

// Severity hierarchy for filtering
const SEVERITY_ORDER: ErrorSeverity[] = ['debug', 'info', 'warning', 'error', 'critical'];

// Current user ID (set after auth)
let currentUserId: string | null = null;

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Set the current user ID for logging
 */
export function setLoggingUserId(userId: string | null): void {
    currentUserId = userId;
}

/**
 * Log debug message (development only)
 */
export function logDebug(message: string, context?: Record<string, any>): void {
    log('debug', 'unknown', message, context);
}

/**
 * Log info message
 */
export function logInfo(category: ErrorCategory, message: string, context?: Record<string, any>): void {
    log('info', category, message, context);
}

/**
 * Log warning
 */
export function logWarning(category: ErrorCategory, message: string, context?: Record<string, any>): void {
    log('warning', category, message, context);
}

/**
 * Log error
 */
export function logError(category: ErrorCategory, error: Error | string, context?: Record<string, any>): void {
    const message = error instanceof Error ? error.message : error;
    const stackTrace = error instanceof Error ? error.stack : undefined;
    log('error', category, message, { ...context, stackTrace });
}

/**
 * Log critical error (always sent to Firebase)
 */
export function logCritical(category: ErrorCategory, error: Error | string, context?: Record<string, any>): void {
    const message = error instanceof Error ? error.message : error;
    const stackTrace = error instanceof Error ? error.stack : undefined;
    log('critical', category, message, { ...context, stackTrace });
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandling<T>(
    fn: () => Promise<T>,
    category: ErrorCategory,
    fallback?: T
): Promise<T> {
    return fn().catch((error) => {
        logError(category, error);
        if (fallback !== undefined) {
            return fallback;
        }
        throw error;
    });
}

/**
 * Create user-friendly error message
 */
export function getUserFriendlyMessage(error: Error | string, category: ErrorCategory): string {
    const messages: Record<ErrorCategory, string> = {
        auth: 'Authentication failed. Please try logging in again.',
        network: 'Unable to connect. Please check your internet connection.',
        payment: 'Payment could not be processed. Please try again.',
        location: 'Unable to get your location. Please enable GPS.',
        firebase: 'Service temporarily unavailable. Please try again.',
        api: 'Something went wrong. Please try again.',
        validation: 'Please check your input and try again.',
        permission: 'Permission denied. Please grant the required permissions.',
        ui: 'Display error. Please restart the app.',
        unknown: 'An unexpected error occurred. Please try again.',
    };

    return messages[category] || messages.unknown;
}

/**
 * Handle global uncaught errors
 */
export function setupGlobalErrorHandler(): void {
    // For React Native
    if (Platform.OS !== 'web') {
        const originalHandler = ErrorUtils.getGlobalHandler();

        ErrorUtils.setGlobalHandler((error, isFatal) => {
            logCritical('unknown', error, { isFatal });

            // Call original handler
            if (originalHandler) {
                originalHandler(error, isFatal);
            }
        });
    }

    // For web
    if (typeof window !== 'undefined') {
        window.onerror = (message, source, lineno, colno, error) => {
            logCritical('unknown', error || String(message), { source, lineno, colno });
            return false; // Don't prevent default handling
        };

        window.onunhandledrejection = (event) => {
            logCritical('unknown', event.reason, { type: 'unhandledRejection' });
        };
    }
}

// ============================================================================
// PRIVATE FUNCTIONS
// ============================================================================

function log(
    severity: ErrorSeverity,
    category: ErrorCategory,
    message: string,
    context?: Record<string, any>
): void {
    const entry: LogEntry = {
        timestamp: new Date(),
        severity,
        category,
        message,
        context,
        userId: currentUserId || undefined,
        sessionId: CONFIG.SESSION_ID,
        platform: Platform.OS,
        appVersion: CONFIG.APP_VERSION,
    };

    // Console logging (development)
    if (CONFIG.LOG_TO_CONSOLE) {
        logToConsole(entry);
    }

    // Firebase logging (production, errors only)
    if (CONFIG.LOG_TO_FIREBASE && shouldLogToFirebase(severity)) {
        logToFirebase(entry).catch(console.error);
    }
}

function logToConsole(entry: LogEntry): void {
    const prefix = `[${entry.severity.toUpperCase()}] [${entry.category}]`;
    const msg = `${prefix} ${entry.message}`;

    switch (entry.severity) {
        case 'debug':
            console.debug(msg, entry.context || '');
            break;
        case 'info':
            console.info(msg, entry.context || '');
            break;
        case 'warning':
            console.warn(msg, entry.context || '');
            break;
        case 'error':
        case 'critical':
            console.error(msg, entry.context || '');
            break;
    }
}

async function logToFirebase(entry: LogEntry): Promise<void> {
    try {
        await addDoc(collection(db, 'error_logs'), {
            ...entry,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        // Don't throw if logging fails - could cause infinite loop
        console.error('Failed to log to Firebase:', error);
    }
}

function shouldLogToFirebase(severity: ErrorSeverity): boolean {
    const minIndex = SEVERITY_ORDER.indexOf(CONFIG.MIN_SEVERITY_FOR_FIREBASE);
    const currentIndex = SEVERITY_ORDER.indexOf(severity);
    return currentIndex >= minIndex;
}

// ============================================================================
// NETWORK ERROR HELPER
// ============================================================================

/**
 * Check if error is a network error
 */
export function isNetworkError(error: any): boolean {
    if (!error) return false;

    const networkIndicators = [
        'network',
        'fetch',
        'connection',
        'timeout',
        'ECONNREFUSED',
        'ENOTFOUND',
        'NetworkError',
        'internet',
    ];

    const message = error.message?.toLowerCase() || '';
    const code = error.code?.toLowerCase() || '';

    return networkIndicators.some(indicator =>
        message.includes(indicator.toLowerCase()) ||
        code.includes(indicator.toLowerCase())
    );
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    options: {
        maxRetries?: number;
        initialDelay?: number;
        maxDelay?: number;
        category?: ErrorCategory;
    } = {}
): Promise<T> {
    const {
        maxRetries = 3,
        initialDelay = 1000,
        maxDelay = 10000,
        category = 'network'
    } = options;

    let lastError: Error | null = null;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;

            if (attempt < maxRetries) {
                logWarning(category, `Retry attempt ${attempt + 1}/${maxRetries}`, {
                    error: error.message
                });

                await new Promise(resolve => setTimeout(resolve, delay));
                delay = Math.min(delay * 2, maxDelay);
            }
        }
    }

    logError(category, lastError || 'Max retries exceeded');
    throw lastError;
}

// ============================================================================
// ERROR BOUNDARY HELPER
// ============================================================================

/**
 * Capture component error for logging
 */
export function captureComponentError(
    error: Error,
    componentName: string,
    errorInfo?: { componentStack?: string }
): void {
    logError('ui', error, {
        component: componentName,
        componentStack: errorInfo?.componentStack,
    });
}

// Export default error handler setup
export default {
    setLoggingUserId,
    logDebug,
    logInfo,
    logWarning,
    logError,
    logCritical,
    withErrorHandling,
    getUserFriendlyMessage,
    setupGlobalErrorHandler,
    isNetworkError,
    retryWithBackoff,
    captureComponentError,
};
