// ⚡ ResQ Kenya - Tracking Entry Point
// Redirects to the searching screen with passed params
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function TrackingIndex() {
    const params = useLocalSearchParams();
    return <Redirect href={{ pathname: '/(customer)/request/tracking/searching', params }} />;
}
