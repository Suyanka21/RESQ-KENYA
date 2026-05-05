declare module '@expo/vector-icons' {
    export const Ionicons: any;
    export const MaterialIcons: any;
    export const FontAwesome: any;
    // Add other icon sets as needed
}

// Minimal ambient typing for react-test-renderer — the @types package
// is not installed and only Phase 6 unit tests use it. We type only
// what those tests touch (`create` + `act`).
declare module 'react-test-renderer' {
    interface TestRenderer {
        unmount(): void;
    }
    export function create(element: unknown): TestRenderer;
    export function act(scope: () => void | Promise<void>): void | Promise<void>;
}
