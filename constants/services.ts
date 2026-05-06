// ResQ Kenya — Centralized Service Catalog
// Single source of truth for service definitions.
// Resolves F-MED-2: SERVICES array in home screen duplicating theme-owned data.

import { Truck, Fuel, Battery, Disc, Activity, HeartPulse } from 'lucide-react-native';
import { colors } from '../theme/voltage-premium';
import type { ServiceType } from '../types/api';

export interface ServiceMeta {
    id: ServiceType;
    name: string;
    icon: typeof Truck;
    color: string;
    bg: string;
    keywords: string[];
}

export const SERVICE_CATALOG: Record<ServiceType, ServiceMeta> = {

    towing: {
        id: 'towing',
        name: 'Towing',
        icon: Truck,
        color: colors.service.towing,
        bg: `${colors.service.towing}1F`,
        keywords: ['tow', 'flatbed', 'stuck'],
    },
    fuel: {
        id: 'fuel',
        name: 'Fuel',
        icon: Fuel,
        color: colors.service.fuel,
        bg: `${colors.service.fuel}1F`,
        keywords: ['fuel', 'petrol', 'diesel', 'gas'],
    },
    battery: {
        id: 'battery',
        name: 'Battery',
        icon: Battery,
        color: colors.service.battery,
        bg: `${colors.service.battery}1F`,
        keywords: ['battery', 'jump', 'jumpstart', 'dead'],
    },
    tire: {
        id: 'tire',
        name: 'Tire',
        icon: Disc,
        color: colors.service.tire,
        bg: `${colors.service.tire}1F`,
        keywords: ['tire', 'tyre', 'flat', 'puncture'],
    },
    diagnostics: {
        id: 'diagnostics',
        name: 'Diagnostics',
        icon: Activity,
        color: colors.service.diagnostic,
        bg: `${colors.service.diagnostic}1F`,
        keywords: ['scan', 'diagnos', 'check', 'engine'],
    },
    ambulance: {
        id: 'ambulance',
        name: 'Ambulance',
        icon: HeartPulse,
        color: colors.service.medical,
        bg: `${colors.service.medical}1F`,
        keywords: ['ambulance', 'medical', 'emergency', 'hospital'],
    },
};

export const SERVICE_LIST = Object.values(SERVICE_CATALOG);
