import React, { useState, useEffect, useCallback } from 'react';
import { Icons } from './components/ui/Icons';
import { DynamicIsland } from './components/os/DynamicIsland';
import { ControlCenter } from './components/os/ControlCenter';
import { Svyatozar } from './components/apps/Svyatozar';
import { FileManager } from './components/apps/FileManager';
import { Browser } from './components/apps/Browser';
import { Photos } from './components/apps/Photos';
import { Settings } from './components/apps/Settings';
import { AppDefinition, WindowState, SystemStatus, VirtualFile, StoredApp, SystemSettings } from './types';

// Default System Apps
const SYSTEM_APPS: AppDefinition[] = [
  {
    id: 'svyatozar',
    name: 'Святозар',
    icon: <Icons.Cpu className="text-white" />,
    color: 'bg-gradient-to-br from-red-600 to-blue-700',
    type: 'system',
    component: null 
  },
  {
    id: 'browser',
    name: 'РуНет',
    icon: <Icons.Globe className="text-white" />,
    color: 'bg-blue-500',
    type: 'system',
    component: null
  },
  {
    id: 'files',
    name: 'Файлы',
    icon: <Icons.LayoutGrid className="text-white" />,
    color: 'bg-orange-400',
    type: 'system',
    component: null
  },
  {
    id: 'settings',
    name: 'Настройки',
    icon: <Icons.Settings className="text-white" />,
    color: 'bg-gray-600',
    type: 'system',
    component: null
  },
  {
    id: 'photos',
    name: 'Фото',
    icon: <Icons.Image className="text-white" />,
    color: 'bg-white text-black',
    type: 'system',
    component: null
  }
];

const DEFAULT_SETTINGS: SystemSettings = {
  wallpaper: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop',
  username: 'Пользователь',
  darkMode: true
};

const App: React.FC = () => {
  // --- State ---
  const [status, setStatus] = useState<SystemStatus>(SystemStatus.LOCKED);
  const [openWindows, setOpenWindows] = useState<WindowState[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [controlCenterOpen, setControlCenterOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Persistent Data
  const [files, setFiles] = useState<VirtualFile[]>([]);
  const [installedApps, setInstalledApps] = useState<StoredApp[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);

  // --- Effects ---

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load Data on Mount
  useEffect(() => {
    const loadedFiles = localStorage.getItem('holyOS_files');
    const loadedApps = localStorage.getItem('holyOS_apps');
    const loadedSettings = localStorage.getItem('holyOS_settings');

    if (loadedFiles) setFiles(JSON.parse(loadedFiles));
    if (loadedApps) setInstalledApps(JSON.parse(loadedApps));
    if (loadedSettings) setSystemSettings(JSON.parse(loadedSettings));
  }, []);

  // Save Data on Change
  useEffect(() => {
    localStorage.setItem('holyOS_files', JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem('holyOS_apps', JSON.stringify(installedApps));
  }, [installedApps]);

  useEffect(() => {
    localStorage.setItem('holyOS_settings', JSON.stringify(systemSettings));
  }, [systemSettings]);

  // --- Actions ---

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const type = file.name.endsWith('.apk') ? 'apk' : 
                   file.type.startsWith('image/') ? 'image' : 
                   'text';
      
      const newFile: VirtualFile = {
        id: Date.now().toString(),
        name: file.name,
        type,
        content: content,
        size: (file.size / 1024).toFixed(1) + ' KB',
        date: new Date().toLocaleDateString()
      };
      
      setFiles(prev => [...prev, newFile]);

      // If it's an APK, offer to install immediately
      if (type === 'apk') {
        if(confirm(`Файл "${file.name}" обнаружен. Установить приложение?`)) {
            installApk(newFile);
        }
      }
    };

    if (file.name.endsWith('.apk')) {
        // Mock APK content read (don't read binary)
        reader.readAsDataURL(file); // Store as data URL just to have a string
    } else if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
    } else {
        reader.readAsText(file);
    }
  };

  const deleteFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const installApk = (file: VirtualFile) => {
    const appName = file.name.replace('.apk', '');
    const newApp: StoredApp = {
      id: `app_${Date.now()}`,
      name: appName.charAt(0).toUpperCase() + appName.slice(1),
      color: 'bg-green-600',
      iconType: 'package',
      installDate: Date.now()
    };
    setInstalledApps(prev => [...prev, newApp]);
    alert(`Приложение ${newApp.name} успешно установлено!`);
  };

  const resetSystem = () => {
    if(confirm('Вы уверены? Это удалит все данные.')) {
        localStorage.clear();
        window.location.reload();
    }
  };

  // --- Window Management ---

  const openApp = (appId: string) => {
    if (openWindows.find(w => w.id === appId)) {
      setActiveWindowId(appId);
      setOpenWindows(prev => prev.map(w => w.id === appId ? { ...w, isMinimized: false, zIndex: 10 } : { ...w, zIndex: 1 }));
    } else {
      setOpenWindows(prev => [...prev.map(w => ({ ...w, zIndex: 1 })), { id: appId, isOpen: true, isMinimized: false, zIndex: 10 }]);
      setActiveWindowId(appId);
    }
  };

  const closeWindow = (id: string) => {
    setOpenWindows(prev => prev.filter(w => w.id !== id));
    if (activeWindowId === id) setActiveWindowId(null);
  };

  const minimizeWindow = (id: string) => {
     setOpenWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: true } : w));
     setActiveWindowId(null);
  };

  // --- Rendering Helpers ---

  const getAppContent = (appId: string) => {
    switch (appId) {
        case 'svyatozar': return <Svyatozar onThinking={setIsThinking} />;
        case 'files': return <FileManager files={files} onUpload={handleFileUpload} onDelete={deleteFile} onInstallApk={installApk} />;
        case 'browser': return <Browser />;
        case 'photos': return <Photos files={files} />;
        case 'settings': return <Settings settings={systemSettings} onUpdateSettings={(s) => setSystemSettings(prev => ({...prev, ...s}))} onReset={resetSystem} />;
        default: 
            // Generic App Runner for User Apps
            const userApp = installedApps.find(a => a.id === appId);
            return (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white">
                    <Icons.Package size={64} className="text-green-500 mb-4" />
                    <h1 className="text-2xl font-bold">{userApp?.name || 'Приложение'}</h1>
                    <p className="opacity-70 mt-2">Эмуляция Android Runtime...</p>
                    <div className="mt-8 w-1/3 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 animate-[width_2s_ease-in-out_infinite]" style={{width: '50%'}}></div>
                    </div>
                </div>
            );
    }
  };

  const getAppIcon = (type: string) => {
      if (type === 'package') return <Icons.Package className="text-white" />;
      return <Icons.Box className="text-white" />; // Fallback
  };

  // Merge System and User Apps for Display
  const allApps = [
      ...SYSTEM_APPS, 
      ...installedApps.map(app => ({
          id: app.id,
          name: app.name,
          icon: getAppIcon(app.iconType),
          color: app.color,
          type: 'user' as const,
          component: null
      }))
  ];

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  // Handle global drag and drop
  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
          handleFileUpload(droppedFiles[0]);
      }
  };

  if (status === SystemStatus.LOCKED) {
    return (
      <div 
        className="h-full w-full bg-cover bg-center flex flex-col items-center justify-between py-20 relative overflow-hidden transition-all duration-700"
        style={{ backgroundImage: `url('${systemSettings.wallpaper}')` }}
        onClick={() => setStatus(SystemStatus.ACTIVE)}
      >
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>
        
        <div className="z-10 flex flex-col items-center animate-in fade-in duration-1000 slide-in-from-bottom-10">
          <Icons.Lock size={40} className="mb-4 text-white/80" />
          <h1 className="text-8xl font-thin tracking-tighter text-white drop-shadow-2xl">{formatTime(currentTime)}</h1>
          <p className="text-xl font-medium text-white/90 mt-2 capitalize">{formatDate(currentTime)}</p>
        </div>

        <div className="z-10 flex flex-col items-center gap-4 animate-pulse">
           <div className="w-16 h-1 bg-white/50 rounded-full"></div>
           <p className="text-sm font-medium tracking-wide">Свайп вверх для разблокировки</p>
        </div>
      </div>
    );
  }

  return (
    <div 
        className="h-full w-full bg-cover bg-center relative overflow-hidden select-none"
        style={{ backgroundImage: `url('${systemSettings.wallpaper}')` }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
    >
      
      {/* Dynamic Island & Status Bar */}
      <div className="absolute top-0 w-full h-8 z-50 flex justify-between items-center px-6 text-white text-xs font-medium">
        <span>{formatTime(currentTime)}</span>
        <div className="flex gap-2 items-center">
           <Icons.Wifi size={14} />
           <Icons.Battery size={14} />
        </div>
      </div>
      <DynamicIsland isThinking={isThinking} />

      {/* Control Center Drawer */}
      {controlCenterOpen && (
        <>
            <div className="absolute inset-0 bg-black/20 z-40" onClick={() => setControlCenterOpen(false)}></div>
            <div className="absolute top-10 right-4 w-80 h-auto glass rounded-[2rem] z-50 animate-in slide-in-from-top-10 duration-300 shadow-2xl border border-white/20">
                <ControlCenter />
            </div>
        </>
      )}

      {/* Trigger Area for Control Center */}
      <div 
        className="absolute top-0 right-0 w-20 h-8 z-[60] cursor-pointer"
        onClick={() => setControlCenterOpen(!controlCenterOpen)}
      ></div>

      {/* Desktop Grid */}
      <div className="w-full h-full pt-20 px-6 pb-32 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-6 content-start">
        {allApps.map(app => (
          <div 
            key={app.id} 
            className="flex flex-col items-center gap-2 group cursor-pointer active:scale-95 transition-transform duration-200"
            onClick={() => openApp(app.id)}
          >
            <div className={`w-16 h-16 ${app.color} rounded-[1.2rem] shadow-lg flex items-center justify-center text-3xl glass group-hover:brightness-110 transition-all border border-white/10 relative`}>
              {app.icon}
              {app.type === 'user' && <div className="absolute bottom-1 right-1 w-2 h-2 bg-white rounded-full"></div>}
            </div>
            <span className="text-xs font-medium text-white shadow-black drop-shadow-md text-center leading-tight">{app.name}</span>
          </div>
        ))}
      </div>

      {/* Windows */}
      {openWindows.map(window => {
        if (window.isMinimized) return null;
        const app = allApps.find(a => a.id === window.id);
        if (!app) return null;

        return (
          <div 
            key={window.id}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] md:w-[800px] h-[80%] md:h-[600px] bg-[#121212] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/10 animate-in zoom-in-95 duration-200`}
            style={{ zIndex: window.zIndex + 10 }}
            onClick={() => {
                setOpenWindows(prev => prev.map(w => w.id === window.id ? { ...w, zIndex: 10 } : { ...w, zIndex: 1 }));
                setActiveWindowId(window.id);
            }}
          >
            {/* Window Header */}
            <div className="h-10 bg-[#1e1e1e] flex items-center justify-between px-4 border-b border-white/5 handle cursor-grab active:cursor-grabbing">
                <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); closeWindow(window.id); }} className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400"></button>
                    <button onClick={(e) => { e.stopPropagation(); minimizeWindow(window.id); }} className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400"></button>
                    <button className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400"></button>
                </div>
                <span className="text-sm font-semibold text-gray-400 select-none">{app.name}</span>
                <div className="w-10"></div>
            </div>
            {/* Window Content */}
            <div className="flex-1 overflow-hidden relative bg-white">
                {getAppContent(app.id)}
            </div>
             {/* Bottom resize handle mock */}
             <div className="h-4 bg-[#1e1e1e] w-full absolute bottom-0 flex justify-center items-center cursor-ns-resize">
                <div className="w-10 h-1 bg-gray-600 rounded-full"></div>
             </div>
          </div>
        );
      })}

      {/* Dock */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 h-20 px-6 glass rounded-[2rem] flex items-center gap-6 shadow-2xl z-50 transition-all hover:px-8 hover:scale-105 duration-300">
        {allApps.slice(0, 4).map(app => (
             <div 
                key={app.id}
                className="group relative flex flex-col items-center gap-1 cursor-pointer"
                onClick={() => openApp(app.id)}
             >
                <div className={`w-12 h-12 ${app.color} rounded-2xl flex items-center justify-center text-xl shadow-lg transition-transform duration-200 group-hover:-translate-y-4 group-hover:scale-110`}>
                    {app.icon}
                </div>
                {/* Active Dot */}
                {openWindows.find(w => w.id === app.id && !w.isMinimized) && (
                    <div className="w-1 h-1 bg-white rounded-full absolute -bottom-2"></div>
                )}
             </div>
        ))}
      </div>
    </div>
  );
};

export default App;
