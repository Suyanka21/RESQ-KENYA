// ⚡ ResQ Kenya - Service Pictogram Icons
// Clean, professional pictogram-style icons for each service category

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme/voltage-premium';

interface ServiceIconProps {
    type: 'towing' | 'battery' | 'tire' | 'fuel' | 'diagnostics' | 'ambulance';
    size?: number;
    color?: string;
    active?: boolean;
}

// Towing Icon - Truck with hook silhouette
const TowingIcon = ({ size, color }: { size: number; color: string }) => (
    <View style={[iconStyles.container, { width: size, height: size }]}>
        {/* Truck body */}
        <View style={[iconStyles.towTruckBody, { backgroundColor: color }]} />
        {/* Cab */}
        <View style={[iconStyles.towTruckCab, { backgroundColor: color }]} />
        {/* Hook */}
        <View style={[iconStyles.towHook, { borderColor: color }]} />
        {/* Wheels */}
        <View style={[iconStyles.wheel, iconStyles.wheelLeft, { backgroundColor: color }]} />
        <View style={[iconStyles.wheel, iconStyles.wheelRight, { backgroundColor: color }]} />
    </View>
);

// Battery/Jumpstart Icon - Battery with lightning
const BatteryIcon = ({ size, color }: { size: number; color: string }) => (
    <View style={[iconStyles.container, { width: size, height: size }]}>
        {/* Battery body */}
        <View style={[iconStyles.batteryBody, { borderColor: color }]}>
            {/* Battery terminal */}
            <View style={[iconStyles.batteryTerminal, { backgroundColor: color }]} />
            {/* Lightning bolt */}
            <View style={[iconStyles.boltTop, { backgroundColor: color }]} />
            <View style={[iconStyles.boltBottom, { backgroundColor: color }]} />
        </View>
    </View>
);

// Tire Icon - Wheel with spokes
const TireIcon = ({ size, color }: { size: number; color: string }) => (
    <View style={[iconStyles.container, { width: size, height: size }]}>
        <View style={[iconStyles.tireOuter, { borderColor: color }]}>
            <View style={[iconStyles.tireInner, { borderColor: color }]}>
                <View style={[iconStyles.tireHub, { backgroundColor: color }]} />
            </View>
        </View>
        {/* Wrench overlay */}
        <View style={[iconStyles.wrenchHandle, { backgroundColor: color }]} />
    </View>
);

// Fuel Icon - Gas pump
const FuelIcon = ({ size, color }: { size: number; color: string }) => (
    <View style={[iconStyles.container, { width: size, height: size }]}>
        {/* Pump body */}
        <View style={[iconStyles.fuelBody, { borderColor: color }]} />
        {/* Pump head */}
        <View style={[iconStyles.fuelHead, { backgroundColor: color }]} />
        {/* Nozzle */}
        <View style={[iconStyles.fuelNozzle, { backgroundColor: color }]} />
        {/* Hose */}
        <View style={[iconStyles.fuelHose, { borderColor: color }]} />
    </View>
);

// Diagnostics Icon - Magnifying glass with gear
const DiagnosticsIcon = ({ size, color }: { size: number; color: string }) => (
    <View style={[iconStyles.container, { width: size, height: size }]}>
        {/* Magnifying glass */}
        <View style={[iconStyles.magCircle, { borderColor: color }]} />
        <View style={[iconStyles.magHandle, { backgroundColor: color }]} />
        {/* Gear center */}
        <View style={[iconStyles.gearCenter, { backgroundColor: color }]} />
    </View>
);

// Ambulance/SOS Icon - Cross symbol
const AmbulanceIcon = ({ size, color }: { size: number; color: string }) => (
    <View style={[iconStyles.container, { width: size, height: size }]}>
        {/* Cross vertical */}
        <View style={[iconStyles.crossVertical, { backgroundColor: color }]} />
        {/* Cross horizontal */}
        <View style={[iconStyles.crossHorizontal, { backgroundColor: color }]} />
    </View>
);

// Main ServiceIcon component
export const ServiceIcon: React.FC<ServiceIconProps> = ({
    type,
    size = 28,
    color = colors.text.primary,
    active = false
}) => {
    const iconColor = active ? colors.charcoal[900] : color;

    switch (type) {
        case 'towing':
            return <TowingIcon size={size} color={iconColor} />;
        case 'battery':
            return <BatteryIcon size={size} color={iconColor} />;
        case 'tire':
            return <TireIcon size={size} color={iconColor} />;
        case 'fuel':
            return <FuelIcon size={size} color={iconColor} />;
        case 'diagnostics':
            return <DiagnosticsIcon size={size} color={iconColor} />;
        case 'ambulance':
            return <AmbulanceIcon size={size} color={iconColor} />;
        default:
            return null;
    }
};

const iconStyles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },

    // Towing truck
    towTruckBody: {
        position: 'absolute',
        width: '60%',
        height: '30%',
        bottom: '25%',
        left: '5%',
        borderRadius: 2,
    },
    towTruckCab: {
        position: 'absolute',
        width: '25%',
        height: '35%',
        bottom: '25%',
        right: '10%',
        borderRadius: 2,
    },
    towHook: {
        position: 'absolute',
        width: '20%',
        height: '20%',
        top: '25%',
        left: '15%',
        borderWidth: 2,
        borderBottomWidth: 0,
        borderRightWidth: 0,
        borderTopLeftRadius: 8,
    },
    wheel: {
        position: 'absolute',
        width: '18%',
        height: '18%',
        borderRadius: 100,
        bottom: '18%',
    },
    wheelLeft: {
        left: '18%',
    },
    wheelRight: {
        right: '22%',
    },

    // Battery
    batteryBody: {
        width: '50%',
        height: '65%',
        borderWidth: 2.5,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    batteryTerminal: {
        position: 'absolute',
        top: -5,
        width: '30%',
        height: 5,
        borderRadius: 2,
    },
    boltTop: {
        width: 8,
        height: 4,
        marginBottom: -1,
        transform: [{ skewX: '-20deg' }],
    },
    boltBottom: {
        width: 8,
        height: 4,
        transform: [{ skewX: '-20deg' }, { translateX: -3 }],
    },

    // Tire
    tireOuter: {
        width: '70%',
        height: '70%',
        borderWidth: 4,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tireInner: {
        width: '50%',
        height: '50%',
        borderWidth: 2,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tireHub: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    wrenchHandle: {
        position: 'absolute',
        width: 3,
        height: '40%',
        bottom: 0,
        right: '20%',
        transform: [{ rotate: '45deg' }],
        borderRadius: 1,
    },

    // Fuel
    fuelBody: {
        position: 'absolute',
        width: '45%',
        height: '60%',
        borderWidth: 2.5,
        borderRadius: 4,
        left: '20%',
        bottom: '15%',
    },
    fuelHead: {
        position: 'absolute',
        width: '25%',
        height: '15%',
        left: '30%',
        top: '18%',
        borderRadius: 2,
    },
    fuelNozzle: {
        position: 'absolute',
        width: 4,
        height: '30%',
        right: '25%',
        top: '30%',
        borderRadius: 2,
    },
    fuelHose: {
        position: 'absolute',
        width: '15%',
        height: '15%',
        right: '22%',
        top: '25%',
        borderWidth: 2,
        borderLeftWidth: 0,
        borderBottomWidth: 0,
        borderTopRightRadius: 8,
    },

    // Diagnostics
    magCircle: {
        width: '50%',
        height: '50%',
        borderWidth: 3,
        borderRadius: 100,
        position: 'absolute',
        top: '15%',
        left: '15%',
    },
    magHandle: {
        position: 'absolute',
        width: 4,
        height: '35%',
        bottom: '10%',
        right: '20%',
        borderRadius: 2,
        transform: [{ rotate: '45deg' }],
    },
    gearCenter: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        top: '32%',
        left: '32%',
    },

    // Ambulance cross
    crossVertical: {
        width: '25%',
        height: '70%',
        borderRadius: 3,
    },
    crossHorizontal: {
        position: 'absolute',
        width: '70%',
        height: '25%',
        borderRadius: 3,
    },
});

export default ServiceIcon;
