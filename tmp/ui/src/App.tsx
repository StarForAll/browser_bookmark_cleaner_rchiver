import React, { useState } from 'react';
import { 
  Archive, 
  Network, 
  Copy, 
  Zap, 
  CloudUpload, 
  RotateCw, 
  AlertCircle, 
  Search, 
  Plus, 
  X, 
  ExternalLink,
  ChevronDown,
  History,
  Globe,
  Settings,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
      active ? "bg-surface-container-lowest shadow-ambient text-primary" : "text-secondary/70 hover:bg-surface-container-low hover:text-primary"
    )}
  >
    <Icon size={20} className={cn("transition-transform group-hover:scale-110", active ? "text-primary" : "text-secondary/50")} />
    <span className="font-medium text-sm tracking-tight">{label}</span>
  </button>
);

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-on-surface/10 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg glass-panel rounded-3xl overflow-hidden shadow-2xl"
        >
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
              <button onClick={onClose} className="p-2 hover:bg-surface-container-low rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// --- Views ---

const ArchiveView = () => (
  <div className="flex-1 flex flex-col items-center justify-center p-8">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center max-w-md"
    >
      <div className="w-20 h-20 bg-surface-container-lowest rounded-full flex items-center justify-center mx-auto mb-8 shadow-ambient">
        <Archive size={32} className="text-primary/40" />
      </div>
      <h1 className="text-4xl font-bold mb-4 tracking-tighter">无书签可显示</h1>
      <p className="text-secondary/60 mb-10 leading-relaxed">
        将文件拖放至此处，或从浏览器同步以开启您的档案之旅。
      </p>
      <div className="flex items-center justify-center gap-4">
        <button className="px-8 py-3.5 bg-primary text-on-primary rounded-2xl font-semibold shadow-lg hover:bg-primary-dim transition-all active:scale-95">
          开始导入
        </button>
        <button className="px-8 py-3.5 bg-surface-container-lowest text-primary border border-outline-variant/20 rounded-2xl font-semibold shadow-sm hover:bg-surface-container-low transition-all active:scale-95">
          了解工作流
        </button>
      </div>
    </motion.div>
  </div>
);

const MindMapView = () => (
  <div className="flex-1 relative overflow-hidden bg-[radial-gradient(#e2e3e2_1px,transparent_1px)] [background-size:32px_32px]">
    <div className="absolute top-8 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-10">
      <div className="glass-panel rounded-2xl flex items-center px-4 py-2 gap-3">
        <Search size={18} className="text-secondary/40" />
        <input 
          type="text" 
          placeholder="搜索标题或 URL..." 
          className="flex-1 bg-transparent border-none outline-none text-sm py-2"
        />
        <div className="flex items-center gap-2 pl-4 border-l border-outline-variant/20">
          <span className="text-xs font-semibold text-secondary/40">仅重复项</span>
          <div className="w-8 h-4 bg-surface-container-highest rounded-full relative cursor-pointer">
            <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm" />
          </div>
        </div>
      </div>
    </div>

    {/* Simplified Mind Map Visualization */}
    <div className="absolute inset-0 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <path d="M 500 400 C 600 400, 650 300, 750 300" stroke="#e2e3e2" strokeWidth="2" fill="none" strokeDasharray="4 4" />
        <path d="M 500 400 C 600 400, 650 500, 750 500" stroke="#e2e3e2" strokeWidth="2" fill="none" strokeDasharray="4 4" />
      </svg>
      
      <div className="relative">
        {/* Center Node */}
        <motion.div 
          drag
          className="artifact-card w-48 text-center cursor-grab active:cursor-grabbing"
        >
          <h3 className="font-bold text-lg mb-1">2024 设计灵感</h3>
          <p className="text-xs text-secondary/50 mb-3">156 个书签</p>
          <div className="flex justify-center -space-x-2">
            {[1,2,3].map(i => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-surface-container-highest overflow-hidden">
                <img src={`https://picsum.photos/seed/design${i}/40/40`} alt="" referrerPolicy="no-referrer" />
              </div>
            ))}
            <div className="w-6 h-6 rounded-full border-2 border-white bg-surface-container-highest flex items-center justify-center text-[8px] font-bold text-secondary/60">
              +154
            </div>
          </div>
        </motion.div>

        {/* Child Node 1 */}
        <motion.div 
          drag
          style={{ x: 250, y: -100 }}
          className="absolute artifact-card w-56 flex items-center gap-3 p-4 cursor-grab active:cursor-grabbing"
        >
          <div className="w-10 h-10 bg-surface-container-low rounded-lg flex items-center justify-center shrink-0">
            <Globe size={18} className="text-primary/40" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-sm truncate">现代简约主义美学</h4>
            <p className="text-[10px] text-secondary/40 truncate">behance.net/gallery/123...</p>
          </div>
        </motion.div>

        {/* Child Node 2 */}
        <motion.div 
          drag
          style={{ x: 250, y: 100 }}
          className="absolute artifact-card w-56 flex items-center gap-3 p-4 cursor-grab active:cursor-grabbing"
        >
          <div className="w-10 h-10 bg-surface-container-low rounded-lg overflow-hidden shrink-0">
            <img src="https://picsum.photos/seed/arch/80/80" alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-sm truncate">排版设计原则</h4>
            <p className="text-[10px] text-secondary/40 truncate">medium.com/design-tips</p>
          </div>
        </motion.div>
      </div>
    </div>

    {/* Floating Controls */}
    <div className="absolute bottom-8 left-8 flex flex-col gap-2">
      <div className="glass-panel p-4 rounded-2xl text-[10px] text-secondary/60 space-y-2">
        <p className="font-bold text-secondary/40 uppercase tracking-widest mb-2">操作提示</p>
        <div className="flex justify-between gap-8"><span>双击</span><span className="text-secondary">编辑</span></div>
        <div className="flex justify-between gap-8"><span>Enter</span><span className="text-secondary">子节点</span></div>
        <div className="flex justify-between gap-8"><span>Del</span><span className="text-secondary">删除</span></div>
      </div>
    </div>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('Archive');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(true);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-outline-variant/10 bg-surface/50 backdrop-blur-xl z-20">
        <div className="p-6 mb-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-lg">
              <User size={20} />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-tight">Workspace</h2>
              <p className="text-[10px] text-secondary/50">Editorial Archive</p>
            </div>
          </div>
          
          <nav className="space-y-1">
            <SidebarItem icon={Archive} label="Archive" active={activeTab === 'Archive'} onClick={() => setActiveTab('Archive')} />
            <SidebarItem icon={Network} label="Mind Map" active={activeTab === 'Mind Map'} onClick={() => setActiveTab('Mind Map')} />
            <SidebarItem icon={Copy} label="Duplicates" active={activeTab === 'Duplicates'} onClick={() => setActiveTab('Duplicates')} />
            <SidebarItem icon={Zap} label="Shortcuts" />
          </nav>
        </div>
        
        <div className="mt-auto p-6">
          <button 
            onClick={() => setIsConfigModalOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-secondary/70 hover:bg-surface-container-low transition-colors"
          >
            <Settings size={20} />
            <span className="font-medium text-sm">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-10 border-b border-outline-variant/10 bg-surface/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-12">
            <h1 className="text-xl font-bold tracking-tighter text-primary">The Silent Curator</h1>
            <nav className="flex items-center gap-8">
              {['Archive', 'Mind Map', 'Duplicates'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "text-sm font-semibold transition-all relative py-2",
                    activeTab === tab ? "text-primary" : "text-secondary/40 hover:text-secondary"
                  )}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold shadow-lg hover:bg-primary-dim transition-all active:scale-95">
              <CloudUpload size={18} />
              Save to WebDAV
            </button>
            <button className="p-2.5 text-secondary/40 hover:text-primary transition-colors">
              <RotateCw size={20} />
            </button>
            <button className="p-2.5 text-secondary/40 hover:text-primary transition-colors">
              <AlertCircle size={20} />
            </button>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'Archive' ? <ArchiveView /> : <MindMapView />}
        </div>

        {/* Footer Status Bar */}
        <footer className="h-10 flex items-center justify-between px-6 border-t border-outline-variant/10 bg-surface-container-low/50 text-[10px] text-secondary/40 font-bold uppercase tracking-widest">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <History size={12} />
              LAST SYNC: 2M AGO
            </div>
            <div className="flex items-center gap-2">
              <Network size={12} />
              TARGET: WEBDAV
            </div>
          </div>
          <div className="flex items-center gap-2 text-error">
            <div className="w-1.5 h-1.5 rounded-full bg-error animate-pulse" />
            STATUS: SYNC ERROR
          </div>
        </footer>

        {/* Error Toast */}
        <AnimatePresence>
          {showErrorToast && (
            <motion.div 
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="absolute bottom-16 right-8 w-96 artifact-card border-l-4 border-error p-6 z-40"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-error/10 text-error rounded-xl">
                  <AlertCircle size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-sm">WebDAV 同步失败</h3>
                    <button onClick={() => setShowErrorToast(false)} className="text-secondary/40 hover:text-secondary">
                      <X size={16} />
                    </button>
                  </div>
                  <p className="text-xs text-secondary/60 leading-relaxed mb-4">
                    连接超时（30秒后仍无响应）。请检查网络配置或服务器地址。
                  </p>
                  <div className="bg-surface-container-low p-3 rounded-lg font-mono text-[10px] text-error/80 space-y-1">
                    <p>[ERR_CONNECTION_TIMED_OUT] 0x0042</p>
                    <p>Timestamp: 2023-10-27 14:22:01</p>
                    <p>Req: PUT /remote.php/dav/files/user/archive.json</p>
                    <p>Latency: 30004ms</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <Modal isOpen={isConfigModalOpen} onClose={() => setIsConfigModalOpen(false)} title="WebDAV 配置">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary/60 uppercase tracking-widest">服务器地址 (URL)</label>
            <input 
              type="text" 
              defaultValue="https://dav.jianguoyun.com/dav/"
              className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-sm border-none outline-none focus:ring-2 ring-primary/20 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary/60 uppercase tracking-widest">用户名</label>
            <input 
              type="text" 
              placeholder="yourname@email.com"
              className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-sm border-none outline-none focus:ring-2 ring-primary/20 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary/60 uppercase tracking-widest">应用密码</label>
            <div className="relative">
              <input 
                type="password" 
                defaultValue="••••••••••••••••"
                className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-sm border-none outline-none focus:ring-2 ring-primary/20 transition-all"
              />
              <button className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary/40">
                <Zap size={16} />
              </button>
            </div>
          </div>
          <button className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold shadow-lg hover:bg-primary-dim transition-all active:scale-95 mt-4">
            测试连接并保存
          </button>
          
          <div className="pt-6 border-t border-outline-variant/10">
            <h4 className="text-xs font-bold text-secondary/60 uppercase tracking-widest mb-4 flex items-center gap-2">
              <History size={14} /> 同步版本记录
            </h4>
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="p-4 bg-surface-container-low rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold mb-1">2023-11-24 14:20</p>
                    <p className="text-[10px] text-secondary/50">包含 1,204 个书签，12 个思维导图节点</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-surface-container-lowest text-[10px] font-bold rounded-lg shadow-sm">恢复至浏览器</button>
                    <button className="px-3 py-1.5 bg-surface-container-lowest text-[10px] font-bold rounded-lg shadow-sm">恢复为草稿</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Floating Action Button (FAB) for adding new artifacts */}
      <button 
        onClick={() => setIsEditModalOpen(true)}
        className="fixed bottom-16 right-8 w-14 h-14 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-30"
      >
        <Plus size={28} />
      </button>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="编辑书签节点">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary/60 uppercase tracking-widest">标题名称</label>
            <input 
              type="text" 
              defaultValue="现代主义建筑在数字时代的影响"
              className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-sm border-none outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary/60 uppercase tracking-widest">资源路径 (URL)</label>
            <input 
              type="text" 
              defaultValue="https://arch-daily.com/modernism-digital-archive"
              className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-sm border-none outline-none font-mono text-xs"
            />
          </div>
          
          <div className="p-4 bg-surface-container-low rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
              <img src="https://picsum.photos/seed/arch2/100/100" alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold">预览图像已自动提取</p>
              <p className="text-[10px] text-secondary/40">2024年10月12日 捕获</p>
            </div>
            <button className="text-[10px] font-bold text-primary hover:underline">重新抓取</button>
          </div>

          <div className="p-4 bg-error/5 rounded-2xl border border-error/10 flex gap-3">
            <AlertCircle size={18} className="text-error shrink-0" />
            <p className="text-[10px] text-error/80 leading-relaxed">
              注意：更新此节点将触发全局索引重排。如果后续执行“覆盖同步”，此版本将成为最终物理存证。
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button className="flex-1 py-4 bg-error text-on-primary rounded-2xl font-bold shadow-lg hover:opacity-90 transition-all">
              确认并覆盖同步
            </button>
            <button onClick={() => setIsEditModalOpen(false)} className="px-8 py-4 bg-surface-container-low text-secondary rounded-2xl font-bold hover:bg-surface-container-high transition-all">
              取消
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
