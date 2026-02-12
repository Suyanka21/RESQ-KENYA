// Jest Setup - Mock all problematic Expo/Firebase imports
// This prevents the Expo winter runtime error

// Mock the entire expo module to prevent winter runtime issues
jest.mock('expo', () => ({}));

// Mock config/firebase to prevent ESM issues with the Expo virtual env module
jest.mock('./config/firebase', () => ({
    db: {},
    auth: { currentUser: null },
    app: {},
    default: {},
}), { virtual: true });

jest.mock('../config/firebase', () => ({
    db: {},
    auth: { currentUser: null },
    app: {},
    default: {},
}), { virtual: true });

// Mock Firebase
jest.mock('firebase/app', () => ({
    initializeApp: jest.fn(() => ({})),
    getApps: jest.fn(() => []),
}));

jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(() => ({ currentUser: null })),
    signInWithPhoneNumber: jest.fn(),
    PhoneAuthProvider: { credential: jest.fn() },
    signInWithCredential: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
    getFirestore: jest.fn(),
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    setDoc: jest.fn(),
}));

jest.mock('firebase/functions', () => ({
    getFunctions: jest.fn(),
    httpsCallable: jest.fn(() => jest.fn(() => Promise.resolve({ data: {} }))),
}));

jest.mock('firebase/database', () => ({
    getDatabase: jest.fn(),
    ref: jest.fn(),
    set: jest.fn(),
}));

// Mock Expo modules
jest.mock('expo-location', () => ({
    requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    getCurrentPositionAsync: jest.fn(() => Promise.resolve({ coords: { latitude: -1.29, longitude: 36.82 } })),
}));

jest.mock('expo-notifications', () => ({
    setNotificationHandler: jest.fn(),
    getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
}));

jest.mock('expo-router', () => ({
    router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
    useLocalSearchParams: jest.fn(() => ({})),
    Link: 'Link',
}));

// Mock @expo/vector-icons (used in EmergencySOS.tsx and other components)
// Using virtual: true since the package may not be installed
jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
    MaterialIcons: 'MaterialIcons',
    FontAwesome: 'FontAwesome',
    FontAwesome5: 'FontAwesome5',
    Feather: 'Feather',
    AntDesign: 'AntDesign',
    Entypo: 'Entypo',
}), { virtual: true });

// Mock react-native components that need it (virtual mock since react-native may not be installed)
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}), { virtual: true });

