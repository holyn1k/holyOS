import { ReactNode } from 'react';

export interface AppDefinition {
  id: string;
  name: string;
  icon: ReactNode;
  component: ReactNode;
  color: string;
  type: 'system' | 'user';
}

export interface StoredApp {
  id: string;
  name: string;
  color: string;
  iconType: string;
  installDate: number;
}

export interface VirtualFile {
  id: string;
  name: string;
  type: 'image' | 'text' | 'apk' | 'unknown';
  content: string; // Base64 or text content
  size: string;
  date: string;
}

export interface WindowState {
  id: string;
  isOpen: boolean;
  isMinimized: boolean;
  zIndex: number;
}

export enum SystemStatus {
  LOCKED = 'LOCKED',
  ACTIVE = 'ACTIVE',
  SLEEP = 'SLEEP'
}

export interface SystemSettings {
  wallpaper: string;
  username: string;
  darkMode: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}
