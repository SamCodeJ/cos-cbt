import { NativeModulesProxy } from 'expo-modules-core';

const KioskModeModule = NativeModulesProxy.KioskMode;

export async function enableKioskMode(): Promise<boolean> {
  return await KioskModeModule.enableKioskMode();
}

export async function disableKioskMode(): Promise<boolean> {
  return await KioskModeModule.disableKioskMode();
}

export async function isKioskModeActive(): Promise<boolean> {
  return await KioskModeModule.isKioskModeActive();
}
