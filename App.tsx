
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Plus, Search, ChevronRight, X, Calendar, Edit3, Trash2, Check,
  Sparkles, Palette, Sun, Leaf, Snowflake, Flower2,
  Sprout, Ghost, Coffee, Apple, Shirt, Wand2, Monitor, Menu, Globe, Filter, Settings2, PlusCircle,
  Highlighter, Underline, MessageSquare, Save, Trash, Type as TypeIcon, Tag as TagIcon,
  List as ListIcon, Layout as LayoutIcon, Star, Pin, Home, User, MoreHorizontal, ArrowLeft
} from 'lucide-react';
import { Material, Annotation } from './types';
import { analyzeMaterial } from './geminiService';

type ThemeMode = 'minimal' | 'pixel' | 'stardew' | 'custom';
type Season = 'Spring' | 'Summer' | 'Autumn' | 'Winter';
type TabKey = 'vault' | 'me';

interface ThemeConfig {
  mode: ThemeMode;
  fontFamily: string;
  bgColor: string;
  panelColor: string;
  textColor: string;
  accentColor: string;
  borderColor: string;
  borderRadius: string;
  borderWidth: string;
  shadow: string;
}

const PRESETS: Record<ThemeMode, ThemeConfig> = {
  minimal: {
    mode: 'minimal',
    fontFamily: "'Noto Sans SC', sans-serif",
    bgColor: '#F7F7F7',
    panelColor: '#ffffff',
    textColor: '#191919',
    accentColor: '#07C160',
    borderColor: '#EEEEEE',
    borderRadius: '12px',
    borderWidth: '0px',
    shadow: '0 2px 10px rgba(0,0,0,0.05)'
  },
  pixel: {
    mode: 'pixel',
    fontFamily: "'ZCOOL KuaiLe', cursive",
    bgColor: '#5c94fc',
    panelColor: '#ffffff',
    textColor: '#000000',
    accentColor: '#f8d800',
    borderColor: '#000000',
    borderRadius: '0px',
    borderWidth: '3px',
    shadow: '4px 4px 0px 0px rgba(0,0,0,1)'
  },
  stardew: {
    mode: 'stardew',
    fontFamily: "'ZCOOL XiaoWei', serif",
    bgColor: '#3d2817',
    panelColor: '#F4E4BC',
    textColor: '#3d2817',
    accentColor: '#5B9B42',
    borderColor: '#724E31',
    borderRadius: '24px',
    borderWidth: '4px',
    shadow: '6px 6px 0px 0px rgba(0,0,0,0.15)'
  },
  custom: {
    mode: 'custom',
    fontFamily: "'Noto Sans SC', sans-serif",
    bgColor: '#ffffff',
    panelColor: '#f3f4f6',
    textColor: '#000000',
    accentColor: '#000000',
    borderColor: '#000000',
    borderRadius: '8px',
    borderWidth: '1px',
    shadow: 'none'
  }
};

const SEASONAL_STARDY_OVERRIDE: Record<Season, Partial<ThemeConfig>> = {
  Spring: { bgColor: '#3d2817', panelColor: '#F4E4BC', accentColor: '#5B9B42', borderColor: '#724E31' },
  Summer: { bgColor: '#2d5a27', panelColor: '#fefce8', accentColor: '#EAB308', borderColor: '#854d0e' },
  Autumn: { bgColor: '#9a3412', panelColor: '#fff7ed', accentColor: '#f97316', borderColor: '#7c2d12' },
  Winter: { bgColor: '#1e293b', panelColor: '#f1f5f9', accentColor: '#0ea5e9', borderColor: '#334155' }
};

const SEASON_DECO: Record<Season, string> = { Spring: '🌸', Summer: '🌻', Autumn: '🍁', Winter: '❄️' };

// Updated defaults per user request
const DEFAULT_CATEGORIES = ['案例', '人物', '金句', '文件', '其他'];
const DEFAULT_DOMAINS = ['生态', '环境', '经济', '税务', '政治', '科技'];

const App: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>(() => JSON.parse(localStorage.getItem('mp-vault-materials') || '[]'));
  const [categories, setCategories] = useState<string[]>(() => JSON.parse(localStorage.getItem('mp-vault-categories') || JSON.stringify(DEFAULT_CATEGORIES)));
  const [domains, setDomains] = useState<string[]>(() => JSON.parse(localStorage.getItem('mp-vault-domains') || JSON.stringify(DEFAULT_DOMAINS)));
  const [theme, setTheme] = useState<ThemeConfig>(() => JSON.parse(localStorage.getItem('mp-vault-theme') || JSON.stringify(PRESETS.stardew)));
  const [season, setSeason] = useState<Season>('Spring');
  const [activeTab, setActiveTab] = useState<TabKey>('vault');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [viewingMaterial, setViewingMaterial] = useState<Material | null>(null);
  
  const [filterCat, setFilterCat] = useState<string>('all');
  const [filterKeyOnly, setFilterKeyOnly] = useState(false);

  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentTheme = useMemo(() => {
    if (theme.mode === 'stardew') return { ...theme, ...SEASONAL_STARDY_OVERRIDE[season] };
    return theme;
  }, [theme, season]);

  useEffect(() => {
    localStorage.setItem('mp-vault-materials', JSON.stringify(materials));
    localStorage.setItem('mp-vault-theme', JSON.stringify(theme));
    localStorage.setItem('mp-vault-categories', JSON.stringify(categories));
    localStorage.setItem('mp-vault-domains', JSON.stringify(domains));
  }, [materials, theme, categories, domains]);

  const toggleSeason = () => {
    const seasons: Season[] = ['Spring', 'Summer', 'Autumn', 'Winter'];
    setSeason(prev => seasons[(seasons.indexOf(prev) + 1) % seasons.length]);
  };

  const handlePlusAction = (e: React.MouseEvent) => {
    e.preventDefault();
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      toggleSeason();
    } else {
      clickTimerRef.current = setTimeout(() => {
        setIsEditorOpen(true);
        clickTimerRef.current = null;
      }, 250);
    }
  };

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchesSearch = (m.title + m.content).toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = filterCat === 'all' || m.category === filterCat;
      const matchesKey = !filterKeyOnly || m.isKeyPoint;
      return matchesSearch && matchesCat && matchesKey;
    });
  }, [materials, searchQuery, filterCat, filterKeyOnly]);

  return (
    <div 
      className="flex flex-col h-screen overflow-hidden transition-colors duration-500 select-none"
      style={{ backgroundColor: currentTheme.bgColor, fontFamily: currentTheme.fontFamily, color: currentTheme.textColor }}
    >
      {/* Background Decor */}
      {currentTheme.mode === 'stardew' && (
        <div className="fixed inset-0 pointer-events-none opacity-20 text-4xl flex flex-wrap gap-10 p-10 overflow-hidden z-0">
          {Array.from({ length: 15 }).map((_, i) => <span key={i} className="float-animation">{SEASON_DECO[season]}</span>)}
        </div>
      )}

      {/* Mini Program Header */}
      <header className="safe-top shrink-0 z-50 pt-12 pb-4 px-4 flex items-center justify-between" style={{ backgroundColor: currentTheme.panelColor }}>
        <div className="flex items-center gap-3">
          {activeTab === 'vault' ? (
            <button 
              onClick={() => setIsOutlineOpen(true)}
              className="p-2 bg-black/5 rounded-xl active:bg-black/10 transition-colors"
            >
              <ListIcon className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={() => setActiveTab('vault')} className="p-2"><ArrowLeft className="w-6 h-6"/></button>
          )}
          <h1 className="text-lg font-bold">
            {activeTab === 'vault' ? '知识农场' : '农场中心'}
          </h1>
        </div>
        
        {/* Mock WeChat Capsule */}
        <div className="bg-black/5 rounded-full px-3 py-1.5 flex items-center gap-4 border border-black/10">
          <MoreHorizontal className="w-5 h-5 opacity-40" />
          <div className="w-[1px] h-4 bg-black/10" />
          <div className="w-4 h-4 rounded-full border-2 border-black/20" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10 px-4 pt-2 pb-24">
        {activeTab === 'vault' && (
          <div className="space-y-4">
            {/* Search & Quick Filters */}
            <div className="sticky top-0 z-20 pb-2">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30 group-focus-within:text-emerald-500" />
                <input 
                  type="text" 
                  placeholder="搜索素材收成..." 
                  className="w-full pl-10 pr-4 py-3 bg-white/80 backdrop-blur rounded-2xl outline-none text-sm transition-all shadow-sm"
                  style={{ boxShadow: currentTheme.shadow }}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
                <button 
                  onClick={() => setFilterCat('all')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filterCat === 'all' ? 'text-white' : 'bg-black/5 opacity-40'}`}
                  style={{ backgroundColor: filterCat === 'all' ? currentTheme.accentColor : '' }}
                >全部</button>
                {categories.map(c => (
                  <button 
                    key={c}
                    onClick={() => setFilterCat(c)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filterCat === c ? 'text-white' : 'bg-black/5 opacity-40'}`}
                    style={{ backgroundColor: filterCat === c ? currentTheme.accentColor : '' }}
                  >{c}</button>
                ))}
                <button 
                  onClick={() => setFilterKeyOnly(!filterKeyOnly)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${filterKeyOnly ? 'border-amber-400 bg-amber-50 text-amber-600 font-bold' : 'bg-black/5 opacity-40 border-transparent'}`}
                >重点 ✨</button>
              </div>
            </div>

            {/* List */}
            {filteredMaterials.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredMaterials.map(m => (
                  <div 
                    key={m.id} 
                    onClick={() => setViewingMaterial(m)}
                    className={`p-5 active:scale-[0.98] transition-all relative ${currentTheme.mode === 'stardew' ? 'paper-texture' : ''}`}
                    style={{ backgroundColor: currentTheme.panelColor, borderRadius: currentTheme.borderRadius, border: `${currentTheme.borderWidth} solid ${currentTheme.borderColor}`, boxShadow: currentTheme.shadow }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">{m.category} · {m.domain}</span>
                      {m.isKeyPoint && <Star className="w-4 h-4 text-amber-500 fill-current" />}
                    </div>
                    <h3 className="text-base font-bold mb-2 line-clamp-1">{m.title}</h3>
                    <p className="text-xs opacity-60 line-clamp-2 leading-relaxed italic">{m.content}</p>
                    <div className="mt-4 flex gap-1.5 flex-wrap">
                      {m.tags.slice(0, 3).map(t => <span key={t} className="text-[8px] px-1.5 py-0.5 bg-black/5 rounded text-slate-400">#{t}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-32 flex flex-col items-center justify-center opacity-10">
                <Sprout className="w-20 h-20 mb-4" />
                <p className="font-bold">农场尚无收成</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'me' && (
          <MeSettings 
            theme={currentTheme} 
            setTheme={setTheme} 
            categories={categories} 
            domains={domains} 
            onManageIndex={() => setIsManageOpen(true)}
          />
        )}
      </main>

      {/* FAB */}
      <button 
        onClick={handlePlusAction}
        className="fixed right-6 bottom-24 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform z-40"
        style={{ backgroundColor: currentTheme.accentColor, color: currentTheme.mode === 'pixel' ? '#000' : '#fff', border: currentTheme.mode === 'pixel' ? '4px solid #000' : 'none' }}
      >
        <Plus className="w-8 h-8" />
        {currentTheme.mode === 'stardew' && <span className="absolute -top-1 -right-1 text-lg">{SEASON_DECO[season]}</span>}
      </button>

      {/* TabBar */}
      <nav className="fixed bottom-0 inset-x-0 h-20 bg-white/90 backdrop-blur border-t border-black/5 flex items-center justify-around px-10 pb-4 z-40" style={{ borderRadius: '24px 24px 0 0' }}>
        <TabItem icon={<Home/>} label="金库" active={activeTab === 'vault'} onClick={() => setActiveTab('vault')} color={currentTheme.accentColor} />
        <TabItem icon={<User/>} label="我的" active={activeTab === 'me'} onClick={() => setActiveTab('me')} color={currentTheme.accentColor} />
      </nav>

      {/* Outline Modal */}
      {isOutlineOpen && (
        <div className="fixed inset-0 z-[150] bg-white flex flex-col animate-in slide-in-from-left duration-300">
          <header className="pt-12 pb-4 px-6 flex items-center justify-between border-b border-black/5">
            <button onClick={() => setIsOutlineOpen(false)} className="p-2"><X className="w-6 h-6" /></button>
            <h2 className="text-base font-bold">大纲索引</h2>
            <div className="w-10" />
          </header>
          <div className="flex-1 overflow-y-auto p-6 space-y-10">
            <OutlineView 
              theme={currentTheme} 
              materials={materials} 
              categories={categories} 
              domains={domains}
              onSelect={(m) => { setViewingMaterial(m); setIsOutlineOpen(false); }} 
            />
          </div>
        </div>
      )}

      {/* Manage Index Modal */}
      {isManageOpen && (
        <ManageIndexModal 
          categories={categories} 
          domains={domains} 
          setCategories={setCategories} 
          setDomains={setDomains} 
          onClose={() => setIsManageOpen(false)} 
        />
      )}

      {/* Editor & Detail */}
      {isEditorOpen && (
        <EditorPage 
          theme={currentTheme} 
          categories={categories} 
          domains={domains} 
          onSave={(m) => { setMaterials([m, ...materials]); setIsEditorOpen(false); }} 
          onClose={() => setIsEditorOpen(false)} 
        />
      )}
      
      {viewingMaterial && (
        <DetailPage 
          theme={currentTheme} 
          material={viewingMaterial} 
          onClose={() => setViewingMaterial(null)} 
          onDelete={(id) => { setMaterials(materials.filter(x => x.id !== id)); setViewingMaterial(null); }} 
          onToggleKey={(id) => setMaterials(materials.map(x => x.id === id ? {...x, isKeyPoint: !x.isKeyPoint} : x))} 
        />
      )}
    </div>
  );
};

const TabItem: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void, color: string }> = ({ icon, label, active, onClick, color }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1 transition-all">
    <div className={`transition-all ${active ? 'scale-110' : 'opacity-30'}`} style={{ color: active ? color : 'inherit' }}>
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 24, strokeWidth: active ? 2.5 : 2 }) : icon}
    </div>
    <span className={`text-[10px] font-bold ${active ? '' : 'opacity-30'}`} style={{ color: active ? color : 'inherit' }}>{label}</span>
  </button>
);

const OutlineView: React.FC<{ 
  theme: ThemeConfig, 
  materials: Material[], 
  categories: string[], 
  domains: string[],
  onSelect: (m: Material) => void 
}> = ({ theme, materials, categories, domains, onSelect }) => {
  const [outlineTab, setOutlineTab] = useState<'type' | 'field'>('type');

  const groups = outlineTab === 'type' ? categories : domains;
  const keyProp = outlineTab === 'type' ? 'category' : 'domain';

  return (
    <div className="space-y-6">
      {/* Outline Sub-Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl">
        <button 
          onClick={() => setOutlineTab('type')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${outlineTab === 'type' ? 'bg-white shadow-sm' : 'opacity-40'}`}
        >按类型 (案例/金句...)</button>
        <button 
          onClick={() => setOutlineTab('field')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${outlineTab === 'field' ? 'bg-white shadow-sm' : 'opacity-40'}`}
        >按领域 (生态/经济...)</button>
      </div>

      <div className="space-y-8 pt-4">
        {groups.map(groupName => {
          const items = materials.filter(m => m[keyProp] === groupName);
          if (items.length === 0) return null;
          return (
            <section key={groupName} className="animate-in fade-in slide-in-from-bottom-2">
              <h3 className="text-xs font-black opacity-30 uppercase tracking-widest mb-3 px-2 flex items-center gap-2">
                <LayoutIcon className="w-3 h-3" /> {groupName}
              </h3>
              <div className="bg-slate-50 rounded-3xl overflow-hidden border border-black/5">
                {items.map((m, i) => (
                  <button 
                    key={m.id} 
                    onClick={() => onSelect(m)}
                    className={`w-full flex items-center justify-between p-4 text-left active:bg-black/5 ${i !== items.length - 1 ? 'border-b border-black/5' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      {m.isKeyPoint ? <Star className="w-4 h-4 text-amber-500 fill-current" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
                      <span className="text-sm font-medium">{m.title}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-10" />
                  </button>
                ))}
              </div>
            </section>
          );
        })}
        {materials.length === 0 && (
          <div className="py-20 text-center opacity-20">
            <Sprout className="w-12 h-12 mx-auto mb-4" />
            <p className="font-bold">农场尚无收成</p>
          </div>
        )}
      </div>
    </div>
  );
};

const MeSettings: React.FC<{ 
  theme: ThemeConfig, 
  setTheme: (t: ThemeConfig) => void, 
  categories: string[], 
  domains: string[],
  onManageIndex: () => void
}> = ({ theme, setTheme, categories, domains, onManageIndex }) => (
  <div className="space-y-6 animate-in fade-in">
    <section>
      <h3 className="text-xs font-black opacity-30 uppercase tracking-widest mb-3 px-2">外观主题</h3>
      <div className="grid grid-cols-2 gap-3">
        {(['minimal', 'pixel', 'stardew'] as ThemeMode[]).map(mode => (
          <button 
            key={mode} 
            onClick={() => setTheme(PRESETS[mode])}
            className={`p-4 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all ${theme.mode === mode ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'bg-white border-transparent opacity-60'}`}
          >
            {mode === 'stardew' ? <Flower2 className="w-8 h-8" /> : mode === 'pixel' ? <Star className="w-8 h-8" /> : <Monitor className="w-8 h-8" />}
            <span className="text-xs font-bold">{mode === 'stardew' ? '星露谷' : mode === 'pixel' ? '像素' : '极简'}</span>
          </button>
        ))}
      </div>
    </section>

    <section>
      <h3 className="text-xs font-black opacity-30 uppercase tracking-widest mb-3 px-2">索引管理</h3>
      <div className="bg-white rounded-3xl p-6 space-y-5 shadow-sm border border-black/5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center"><TagIcon className="w-4 h-4"/></div>
            <span className="text-sm font-bold">类型分类</span>
          </div>
          <span className="text-sm font-black">{categories.length}</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center"><Globe className="w-4 h-4"/></div>
            <span className="text-sm font-bold">专业领域</span>
          </div>
          <span className="text-sm font-black">{domains.length}</span>
        </div>
        <button 
          onClick={onManageIndex}
          className="w-full py-4 mt-2 bg-slate-900 text-white rounded-2xl text-xs font-bold active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <Settings2 className="w-4 h-4" /> 自定义索引大纲
        </button>
      </div>
    </section>

    <div className="flex flex-col items-center py-10 opacity-20">
      <Sprout className="w-8 h-8 mb-2" />
      <p className="text-[10px] font-black uppercase tracking-widest">知识农场 2.2 · 自定义大纲版</p>
    </div>
  </div>
);

const ManageIndexModal: React.FC<{
  categories: string[],
  domains: string[],
  setCategories: (c: string[]) => void,
  setDomains: (d: string[]) => void,
  onClose: () => void
}> = ({ categories, domains, setCategories, setDomains, onClose }) => {
  const [newCat, setNewCat] = useState('');
  const [newDom, setNewDom] = useState('');

  const addCat = () => { if (newCat && !categories.includes(newCat)) { setCategories([...categories, newCat]); setNewCat(''); } };
  const addDom = () => { if (newDom && !domains.includes(newDom)) { setDomains([...domains, newDom]); setNewDom(''); } };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 flex flex-col animate-in slide-in-from-bottom duration-300">
      <header className="pt-12 pb-4 px-6 flex items-center justify-between border-b border-black/5 bg-white">
        <button onClick={onClose} className="p-2"><X className="w-6 h-6"/></button>
        <h2 className="text-base font-bold">调整大纲</h2>
        <div className="w-10" />
      </header>
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <section>
          <h3 className="text-xs font-black opacity-30 uppercase tracking-widest mb-4">类型管理 (Group 1)</h3>
          <div className="flex gap-2 mb-4">
            <input className="flex-1 p-3 bg-white rounded-xl text-sm outline-none border border-black/5" placeholder="添加新类型..." value={newCat} onChange={e => setNewCat(e.target.value)} />
            <button onClick={addCat} className="px-4 bg-black text-white rounded-xl"><Plus className="w-5 h-5"/></button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <span key={c} className="bg-white border border-black/5 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                {c}
                <button onClick={() => setCategories(categories.filter(x => x !== c))} className="text-rose-500 p-0.5"><X className="w-3 h-3"/></button>
              </span>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-black opacity-30 uppercase tracking-widest mb-4">领域管理 (Group 2)</h3>
          <div className="flex gap-2 mb-4">
            <input className="flex-1 p-3 bg-white rounded-xl text-sm outline-none border border-black/5" placeholder="添加新领域..." value={newDom} onChange={e => setNewDom(e.target.value)} />
            <button onClick={addDom} className="px-4 bg-black text-white rounded-xl"><Plus className="w-5 h-5"/></button>
          </div>
          <div className="flex flex-wrap gap-2">
            {domains.map(d => (
              <span key={d} className="bg-white border border-black/5 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                {d}
                <button onClick={() => setDomains(domains.filter(x => x !== d))} className="text-rose-500 p-0.5"><X className="w-3 h-3"/></button>
              </span>
            ))}
          </div>
        </section>
      </div>
      <div className="p-8 bg-white border-t border-black/5">
        <button onClick={onClose} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl">保存并返回</button>
      </div>
    </div>
  );
};

const EditorPage: React.FC<{ theme: ThemeConfig, categories: string[], domains: string[], onSave: (m: Material) => void, onClose: () => void }> = ({ theme, categories, domains, onSave, onClose }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(categories[0] || '其他');
  const [domain, setDomain] = useState(domains[0] || '其他');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSmartTag = async () => {
    if (!content) return;
    setIsAnalyzing(true);
    const result = await analyzeMaterial(content);
    if (result) {
      if (result.category && categories.includes(result.category)) setCategory(result.category);
      if (result.domain && domains.includes(result.domain)) setDomain(result.domain);
    }
    setIsAnalyzing(false);
  };

  const handleSave = () => {
    onSave({
      id: Math.random().toString(36).substr(2, 9),
      title, content, category, domain,
      tags: [], annotations: [],
      createdAt: new Date().toISOString(),
      isKeyPoint: false
    });
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
      <header className="pt-12 pb-4 px-6 flex items-center justify-between border-b border-black/5">
        <button onClick={onClose} className="p-2"><X className="w-6 h-6"/></button>
        <h2 className="text-base font-bold">播种素材</h2>
        <button onClick={handleSave} disabled={!title || !content} className="px-5 py-2 bg-emerald-500 text-white rounded-full text-xs font-bold disabled:opacity-30 active:scale-90 transition-transform">发布</button>
      </header>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <input 
          autoFocus
          className="w-full text-xl font-bold outline-none border-none placeholder:opacity-20"
          placeholder="给这株素材起个名..."
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <textarea 
          className="w-full h-64 text-sm leading-relaxed outline-none border-none resize-none placeholder:opacity-20"
          placeholder="记下你的想法、金句或案例..."
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        <button 
          onClick={handleSmartTag} 
          disabled={isAnalyzing} 
          className="w-full py-4 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold active:bg-emerald-100 transition-colors"
        >
          <Sparkles className={`w-3 h-3 ${isAnalyzing ? 'animate-spin' : ''}`} /> {isAnalyzing ? 'AI 智能分类中...' : 'AI 智能分类助手'}
        </button>
        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black opacity-30 uppercase tracking-widest px-1">类型 (Group 1)</label>
            <select className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none appearance-none border border-black/5" value={category} onChange={e => setCategory(e.target.value)}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black opacity-30 uppercase tracking-widest px-1">领域 (Group 2)</label>
            <select className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none appearance-none border border-black/5" value={domain} onChange={e => setDomain(e.target.value)}>
              {domains.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailPage: React.FC<{ theme: ThemeConfig, material: Material, onClose: () => void, onDelete: (id: string) => void, onToggleKey: (id: string) => void }> = ({ theme, material, onClose, onDelete, onToggleKey }) => (
  <div className="fixed inset-0 z-[110] bg-white flex flex-col animate-in slide-in-from-right duration-300">
    <header className="pt-12 pb-4 px-6 flex items-center justify-between border-b border-black/5">
      <button onClick={onClose} className="p-2"><ArrowLeft className="w-6 h-6"/></button>
      <div className="flex gap-3">
        <button onClick={() => onToggleKey(material.id)} className={`p-2 rounded-xl transition-colors ${material.isKeyPoint ? 'bg-amber-50 text-amber-500' : 'opacity-20 hover:bg-black/5'}`}>
          <Star className={material.isKeyPoint ? 'fill-current' : ''}/>
        </button>
        <button onClick={() => { if(window.confirm('确定要删除这株素材吗？')) onDelete(material.id); }} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
          <Trash2 className="w-5 h-5"/>
        </button>
      </div>
    </header>
    <div className="flex-1 overflow-y-auto p-8 space-y-8">
      <div className="flex gap-2 items-center opacity-40 text-[10px] font-bold uppercase tracking-widest">
        <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg">{material.category}</span>
        <span>·</span>
        <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg">{material.domain}</span>
      </div>
      <h2 className="text-2xl font-black leading-tight">{material.title}</h2>
      <div className="w-12 h-1.5 bg-emerald-500 rounded-full" />
      <p className="text-lg leading-relaxed text-slate-700 whitespace-pre-wrap">{material.content}</p>
      <div className="pt-12 flex flex-wrap gap-2">
        {material.tags.length > 0 ? (
          material.tags.map(t => <span key={t} className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">#{t}</span>)
        ) : (
          <span className="text-[10px] opacity-20 italic">暂无更多标签</span>
        )}
      </div>
    </div>
    <div className="p-8 border-t border-black/5 safe-bottom">
      <button onClick={onClose} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl active:scale-[0.98] transition-all">阅读完毕</button>
    </div>
  </div>
);

export default App;
