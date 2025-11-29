import React, { useState, useEffect, useRef } from 'react';
import { 
  HardDrive, Cloud, Server, Plus, Trash2, LogOut, 
  Menu, User, Shield, Lock, FileText, Image as ImageIcon, 
  Video, Music, Folder, Play, CheckCircle2, AlertCircle, 
  Loader2, X, ChevronDown, Download, Users, Zap, Link as LinkIcon, Eye, EyeOff, Wifi, WifiOff
} from 'lucide-react';

// --- 🔗 YOUR SERVER LINK (Replit) ---
const SERVER_URL = 'https://85b1b529-87f2-4692-953f-e625752adc52-00-3o948i4kpbzx4.pike.replit.dev';

export default function InfiniteDrive() {
  const [authView, setAuthView] = useState('login'); 
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); 
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [files, setFiles] = useState([]);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [godMode, setGodMode] = useState(false);
  
  // Server Status
  const [serverStatus, setServerStatus] = useState('checking'); 

  // Inputs
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 1. SMART SERVER WAKE-UP LOGIC (To fight Cold Start) ---
  useEffect(() => {
    const checkServer = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/`);
        if (res.ok) {
          setServerStatus('online');
        } else {
          setServerStatus('offline');
          setTimeout(checkServer, 3000); 
        }
      } catch (err) {
        setServerStatus('offline');
        setTimeout(checkServer, 3000); 
      }
    };
    checkServer(); 
  }, []);

  // --- INIT & PERSISTENCE ---
  useEffect(() => {
    try {
      const savedUsers = localStorage.getItem('id_users');
      const savedFiles = localStorage.getItem('id_files');
      
      if (savedUsers) {
        setRegisteredUsers(JSON.parse(savedUsers));
      } else {
          const defaults = []; 
          setRegisteredUsers(defaults);
      }

      if (savedFiles) {
        setFiles(JSON.parse(savedFiles));
      }
    } catch (e) {
      console.error("Error loading local storage", e);
    }
  }, []);

  useEffect(() => {
    if (files.length > 0) localStorage.setItem('id_files', JSON.stringify(files));
    if (registeredUsers.length > 0) localStorage.setItem('id_users', JSON.stringify(registeredUsers));
  }, [files, registeredUsers]);

  // --- AUTH ---
  const handleLogin = (e: React.MouseEvent) => {
    e?.preventDefault();
    if (usernameInput === 'admin' && passwordInput === 'admin') {
        const adminUser = { id: 1, username: 'admin', role: 'admin' };
        setCurrentUser(adminUser);
        setIsAuthenticated(true);
        setGodMode(true);
        return;
    }
    const user = registeredUsers.find(u => u.username === usernameInput && u.password === passwordInput);
    if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        if (user.role === 'admin') setGodMode(true); 
    } else {
        alert("Invalid Credentials!");
    }
  };

  const handleRegister = () => {
      if (!usernameInput || !passwordInput) return alert("Please fill all fields");
      if (registeredUsers.some(u => u.username === usernameInput)) return alert("Username taken");
      
      const newUser = { id: Date.now(), username: usernameInput, password: passwordInput, role: 'user' };
      setRegisteredUsers([...registeredUsers, newUser]);
      alert("Account Created! Login now.");
      setAuthView('login');
  };

  // --- REAL UPLOAD ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (serverStatus !== 'online') {
        alert("⏳ Server is Waking Up... Please wait for the green 'Online' status.");
        return;
      }

      const file = e.target.files?.[0];
      if (!file) return;

      const tempId = Date.now();
      setUploadQueue(prev => [...prev, { id: tempId, name: file.name, status: 'uploading' }]);

      const formData = new FormData();
      formData.append('file', file);

      try {
          const res = await fetch(`${SERVER_URL}/upload`, { method: 'POST', body: formData });
          const data = await res.json();

          if (data.success) {
              const newFile = {
                  id: Date.now(),
                  name: file.name,
                  url: `${SERVER_URL}/file/${data.fileId}`,
                  size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                  type: file.type.split('/')[0],
                  date: new Date().toLocaleDateString(),
                  ownerId: currentUser?.id,
                  ownerName: currentUser?.username
              };
              setFiles(prev => [newFile, ...prev]);
          } else {
              alert("Upload Failed!");
          }
      } catch (err) {
          alert("Network Error!");
      }
      setUploadQueue(prev => prev.filter(u => u.id !== tempId));
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const deleteFile = (fileId: number) => { setFiles(prev => prev.filter(f => f.id !== fileId)); };
  const getIcon = (type: string) => {
      if(type === 'image') return <ImageIcon className="text-red-400" />;
      if(type === 'video') return <Video className="text-red-400" />;
      return <FileText className="text-blue-400" />;
  };

  const filteredFiles = files.filter(f => {
      if (currentUser?.role === 'admin' && godMode) return true; 
      return f.ownerId === currentUser?.id; 
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#131314] flex items-center justify-center p-4 text-white font-sans relative">
        
        <div className className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${serverStatus === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
           {serverStatus === 'online' ? <Wifi className="w-3 h-3"/> : <Loader2 className="w-3 h-3 animate-spin"/>}
           {serverStatus === 'online' ? "Cloud Online" : "Waking Server..."}
        </div>

        <div className="w-full max-w-sm bg-[#1e1f20] p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-[#2a2b2d] rounded-full mb-4"><Cloud className="w-8 h-8 text-blue-400" /></div>
            <h1 className="text-2xl">{authView === 'login' ? 'Sign In' : 'Create Account'}</h1>
            <div className="mt-2 text-xs bg-slate-800 text-slate-400 inline-block px-3 py-1 rounded-full border border-slate-700"> Total Users: {registeredUsers.length}</div>
          </div>
          
          <input className="w-full bg-black/50 border border-slate-700 rounded-lg p-3 mb-3 text-white" placeholder="Username" value={usernameInput} onChange={e=>setUsernameInput(e.target.value)} />
          <input className="w-full bg-black/50 border border-slate-700 rounded-lg p-3 mb-6 text-white" type="password" placeholder="Password" value={passwordInput} onChange={e=>setPasswordInput(e.target.value)} />
          
          {authView === 'login' ? (
              <button onClick={handleLogin} className="w-full bg-blue-600 py-3 rounded-lg font-bold">Login</button>
          ) : (
              <button onClick={handleRegister} className="w-full bg-green-600 py-3 rounded-lg font-bold">Register</button>
          )}
          
          <div className="mt-4 text-center text-sm text-slate-400">
              {authView === 'login' ? (
                  <span onClick={()=>setAuthView('register')}>No account? <b className="text-blue-400 cursor-pointer">Create one</b></span>
              ) : (
                  <span onClick={()=>setAuthView('login')}>Has account? <b className="text-blue-400 cursor-pointer">Login</b></span>
              )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#131314] text-slate-200 font-sans flex flex-col">
      <div className="p-4 bg-[#1e1f20] flex justify-between items-center shadow-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
              <button onClick={()=>setSidebarOpen(!isSidebarOpen)}><Menu className="w-6 h-6" /></button>
              <span className="text-lg font-medium">Drive</span>
              
              <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${serverStatus === 'online' ? 'bg-green-900/50 text-green-400' : 'bg-amber-900/50 text-amber-400 animate-pulse'}`}>
                 <span className={`w-2 h-2 rounded-full ${serverStatus === 'online' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                 {serverStatus === 'online' ? 'Online' : 'Connecting...'}
              </div>
          </div>
          
          <div className="flex items-center gap-2">
              {currentUser?.role === 'admin' && (
                  <button onClick={() => setGodMode(!godMode)} className={`p-2 rounded-full transition-colors ${godMode ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'}`}>
                      {godMode ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
              )}
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                  {currentUser?.username?.[0].toUpperCase()}
              </div>
          </div>
      </div>

      {godMode && currentUser?.role === 'admin' && (<div className="bg-amber-900/30 text-amber-400 text-xs text-center py-1 border-b border-amber-900/50">⚠️ God Mode Active</div>)}

      {serverStatus !== 'online' && (<div className="bg-amber-500/10 text-amber-400 text-xs text-center py-2 flex justify-center items-center gap-2 border-b border-amber-500/20"><Loader2 className="w-3 h-3 animate-spin" /> Server is sleeping. Waking it up... (This takes ~30s)</div>)}

      {uploadQueue.length > 0 && (<div className="fixed bottom-20 right-4 bg-[#2a2b2d] p-3 rounded-lg shadow-lg z-50 flex items-center gap-3 border border-slate-700"><Loader2 className="animate-spin text-blue-400 w-5 h-5" /><span className="text-sm">Uploading...</span></div>)}

      <div className="flex-grow p-4 space-y-2 overflow-y-auto">
          {filteredFiles.length === 0 ? (<div className="text-center text-slate-600 mt-20"><Cloud className="w-16 h-16 mx-auto mb-2" /><p>No files yet. Upload one!</p></div>) : (
              filteredFiles.map(file => (
                  <div key={file.id} onClick={()=>setPreviewFile(file)} className="flex items-center gap-4 p-3 bg-[#1e1f20] rounded-xl cursor-pointer hover:bg-[#2a2b2d]"><div className="p-2 bg-black/20 rounded-lg">{getIcon(file.type)}</div><div className="flex-grow overflow-hidden"><div className="truncate font-medium text-white">{file.name}</div><div className="text-xs text-slate-500 flex gap-2"><span>{file.size}</span>{currentUser?.role === 'admin' && file.ownerId !== currentUser?.id && (<span className="text-amber-500 flex items-center gap-1 border border-amber-900/50 px-1 rounded bg-amber-900/10"><User className="w-2 h-2" /> {file.ownerName}</span>)}</div></div><button onClick={(e)=>{e.stopPropagation(); navigator.clipboard.writeText(file.url); alert("Link Copied!")}} className="p-2 text-slate-500 hover:text-blue-400"><LinkIcon className="w-5 h-5"/></button><button onClick={(e)=>{e.stopPropagation(); deleteFile(file.id)}} className="p-2 text-slate-500 hover:text-red-400"><Trash2 className="w-5 h-5"/></button></div>))
          )}
      </div>

      {previewFile && (
          <div className="fixed inset-0 bg-black/95 z-50 flex flex-col justify-center items-center p-4">
              <button onClick={()=>setPreviewFile(null)} className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full"><X className="w-6 h-6"/></button>
              
              {previewFile.type === 'image' && <img src={previewFile.url} className="max-w-full max-h-[80vh] rounded" />}
              {previewFile.type === 'video' && <video src={previewFile.url} controls className="max-w-full max-h-[80vh] rounded" />}
              {previewFile.type !== 'image' && previewFile.type !== 'video' && (<div className="text-center"><FileText className="w-20 h-20 mx-auto mb-4 text-slate-500" /><p className="mb-4">{previewFile.name}</p><a href={previewFile.url} target="_blank" className="bg-blue-600 px-6 py-2 rounded-full text-white">Download / View</a></div>)}
          </div>
      )}

      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
      <button onClick={()=> fileInputRef.current?.click()} className="fixed bottom-6 right-6 w-14 h-14 bg-[#c3eed0] rounded-2xl flex items-center justify-center text-black shadow-xl hover:scale-105 transition-transform">
          <Plus className="w-8 h-8" />
      </button>
    </div>
  );
}

          
