import { useEffect, useState } from 'react';
export function useBatteryStatus() {
    const [batteryStatus, setBatteryStatus] = useState({
        level: 0,
        isCharging: false,
    });
    useEffect(() => {
        const navigatorWithBattery = navigator;
        if (!navigatorWithBattery.getBattery) {
            console.warn("Battery Status API is not supported in this browser.");
            return;
        }
        let battery = null;
        const updateBatteryStatus = () => {
            if (battery) {
                setBatteryStatus({
                    level: Math.round(battery.level * 100),
                    isCharging: battery.charging,
                });
            }
        };
        navigatorWithBattery.getBattery().then((bat) => {
            battery = bat;
            updateBatteryStatus();
            battery.addEventListener('chargingchange', updateBatteryStatus);
            battery.addEventListener('levelchange', updateBatteryStatus);
        });
        return () => {
            if (battery) {
                battery.removeEventListener('chargingchange', updateBatteryStatus);
                battery.removeEventListener('levelchange', updateBatteryStatus);
            }
        };
    }, []);
    return batteryStatus;
}
