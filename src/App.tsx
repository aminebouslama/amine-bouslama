/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search, 
  Shield, 
  Server, 
  Network, 
  Monitor, 
  Cpu, 
  ChevronRight,
  TrendingDown,
  TrendingUp,
  BrainCircuit,
  CornerDownRight,
  Loader2,
  Trash2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from './lib/utils';
import { Incident, Severity, Category, Status } from './types';
import { aiService } from './services/aiService';

// --- Components ---

const Badge = ({ children, variant = "default" }: { children: React.ReactNode, variant?: string }) => {
  const styles: Record<string, string> = {
    default: "bg-gray-100 text-gray-700",
    Low: "bg-blue-50 text-blue-700 border-blue-100",
    Medium: "bg-amber-50 text-amber-700 border-amber-100",
    High: "bg-red-50 text-red-700 border-red-100",
    Open: "bg-indigo-50 text-indigo-700",
    Investigating: "bg-purple-50 text-purple-700",
    Resolved: "bg-emerald-50 text-emerald-700",
    Closed: "bg-gray-100 text-gray-700",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded text-[10px] font-mono border uppercase tracking-wider", styles[variant] || styles.default)}>
      {children}
    </span>
  );
};

export default function App() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [newIncident, setNewIncident] = useState({
    title: '',
    description: '',
    severity: 'Medium' as Severity,
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const res = await fetch('/api/incidents');
      const data = await res.json();
      setIncidents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    try {
      // 1. AI Analysis & Classification
      const analysis = await aiService.analyzeIncident(newIncident.title, newIncident.description);
      
      const id = Date.now().toString();
      const incident: Incident = {
        ...newIncident,
        id,
        category: analysis.category,
        status: 'Open',
        priority_score: analysis.priorityScore,
        suggested_order: analysis.suggestedOrder,
        created_at: new Date().toISOString(),
      };

      // 2. Generate Copilot guide immediately
      const copilot = await aiService.generateCopilot(incident);
      incident.copilot_summary = copilot.summary;
      incident.copilot_steps = JSON.stringify(copilot.steps);
      incident.copilot_recommendations = JSON.stringify(copilot.recommendations);

      // 3. Save to DB
      await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incident),
      });

      await fetchIncidents();
      setIsFormOpen(false);
      setNewIncident({ title: '', description: '', severity: 'Medium' });
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure?")) return;
    await fetch(`/api/incidents/${id}`, { method: 'DELETE' });
    await fetchIncidents();
    if (selectedId === id) setSelectedId(null);
  };

  const filteredIncidents = incidents.filter(i => 
    i.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    i.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedIncident = incidents.find(i => i.id === selectedId);

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-black selection:text-white">
      {/* Header */}
      <header className="h-16 border-b border-[#D1D1CF] flex items-center px-8 bg-white/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-black flex items-center justify-center text-white">
            <Shield size={18} />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight uppercase">Sentinel AI</h1>
            <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest">Incident Intelligence</p>
          </div>
        </div>

        <div className="mx-8 h-8 w-[1px] bg-[#D1D1CF]" />

        <div className="relative flex-1 max-w-xl group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity" size={14} />
          <input 
            type="text" 
            placeholder="SEARCH INCIDENTS, LOGS, METADATA..."
            className="w-full bg-[#E8E8E6] rounded px-10 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-black placeholder:opacity-50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex-1" />

        <button 
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wide hover:opacity-80 transition-all active:scale-95"
        >
          <Plus size={14} />
          Create Incident
        </button>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left List Pane */}
        <section className={cn("transition-all duration-300 border-r border-[#D1D1CF]", selectedId ? "w-1/2" : "w-full")}>
          <div className="flex flex-col h-full bg-white">
            <div className="grid grid-cols-[80px_1.5fr_1fr_120px_120px_100px] px-8 py-3 border-b border-[#D1D1CF] bg-[#F9F9F8]">
              <span className="col-header">ID</span>
              <span className="col-header">Subject</span>
              <span className="col-header">Category</span>
              <span className="col-header">Status</span>
              <span className="col-header">Created</span>
              <span className="col-header">Priority</span>
            </div>

            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="p-8 text-center text-xs font-mono opacity-50">INITIALIZING SYSTEMS...</div>
              ) : filteredIncidents.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-xs font-mono opacity-50 uppercase">No incidents detected in current query.</p>
                </div>
              ) : (
                filteredIncidents.map((incident) => (
                  <motion.div 
                    layoutId={`inc-${incident.id}`}
                    key={incident.id}
                    onClick={() => setSelectedId(incident.id === selectedId ? null : incident.id)}
                    className={cn(
                      "group grid grid-cols-[80px_1.5fr_1fr_120px_120px_100px] px-8 py-4 border-b border-[#D1D1CF] cursor-pointer transition-colors relative",
                      selectedId === incident.id ? "bg-black text-white" : "hover:bg-[#E8E8E6]"
                    )}
                  >
                    <span className="data-value opacity-50">#{incident.id.slice(-4)}</span>
                    <div className="flex flex-col gap-1 pr-4">
                      <span className="text-sm font-bold truncate tracking-tight">{incident.title}</span>
                      <span className={cn("text-[10px] truncate opacity-60", selectedId === incident.id ? "text-white/60" : "")}>{incident.description}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <CategoryIcon category={incident.category} className="opacity-50" />
                       <span className="data-value">{incident.category}</span>
                    </div>
                    <div className="flex items-center">
                      <Badge variant={incident.status}>{incident.status}</Badge>
                    </div>
                    <span className="data-value opacity-50 flex items-center">{formatDate(incident.created_at).split(',')[0]}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-[#D1D1CF] h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full", incident.priority_score > 70 ? "bg-red-500" : incident.priority_score > 40 ? "bg-amber-500" : "bg-blue-500")} 
                          style={{ width: `${incident.priority_score}%` }} 
                        />
                      </div>
                      <span className="data-value w-6 text-right">{incident.priority_score}</span>
                    </div>

                    <button 
                      onClick={(e) => handleDelete(incident.id, e)}
                      className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all",
                        selectedId === incident.id && "text-white"
                      )}
                    >
                      <Trash2 size={12} />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Right Detail Pane */}
        <AnimatePresence mode="wait">
          {selectedId && selectedIncident && (
            <motion.section 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="flex-1 bg-[#F9F9F8] overflow-auto z-30"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                     <button onClick={() => setSelectedId(null)} className="p-2 hover:bg-[#E8E8E6] rounded">
                       <X size={16} />
                     </button>
                     <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest font-bold">Details / #{selectedIncident.id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 border border-[#D1D1CF] rounded text-xs font-bold uppercase hover:bg-white transition-colors">Audit Log</button>
                    <button className="px-3 py-1.5 bg-black text-white rounded text-xs font-bold uppercase hover:opacity-80 transition-colors">Update Status</button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-12">
                   <div className="p-4 bg-white technical-border rounded flex flex-col gap-2">
                      <span className="col-header">Severity Level</span>
                      <div className="flex items-center gap-2">
                        <AlertCircle size={14} className={cn(selectedIncident.severity === 'High' ? "text-red-500" : "text-blue-500")} />
                        <span className="text-xl font-bold tracking-tight">{selectedIncident.severity}</span>
                      </div>
                   </div>
                   <div className="p-4 bg-white technical-border rounded flex flex-col gap-2">
                      <span className="col-header">AI Priority Score</span>
                      <div className="flex items-center gap-2">
                        <TrendingUp size={14} className="text-red-500" />
                        <span className="text-xl font-bold tracking-tight">{selectedIncident.priority_score}<span className="text-xs opacity-50 font-normal">/100</span></span>
                      </div>
                   </div>
                   <div className="p-4 bg-white technical-border rounded flex flex-col gap-2">
                      <span className="col-header">Suggested Handling</span>
                      <div className="flex items-center gap-2">
                        <TrendingDown size={14} className="text-blue-500" />
                        <span className="text-xl font-bold tracking-tight">#{selectedIncident.suggested_order}</span>
                      </div>
                   </div>
                </div>

                <div className="mb-12">
                   <h2 className="text-2xl font-bold tracking-tight mb-4">{selectedIncident.title}</h2>
                   <p className="text-sm leading-relaxed opacity-70 mb-6 bg-white p-6 technical-border rounded italic serif">
                     "{selectedIncident.description}"
                   </p>
                </div>

                {/* AI Copilot Section */}
                <div className="p-8 bg-black text-white rounded-xl shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                      <BrainCircuit size={120} />
                   </div>
                   
                   <div className="relative z-10 flex flex-col gap-8">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded">
                            <Cpu size={18} />
                         </div>
                         <h3 className="font-bold tracking-tight uppercase">Sentinel AI Resolution Copilot</h3>
                         <Badge variant="Investigating">Active</Badge>
                      </div>

                      <div className="space-y-6">
                         <div>
                            <p className="text-[10px] font-mono opacity-50 mb-2 uppercase tracking-widest">Analysis Summary</p>
                            <p className="text-sm text-indigo-100 leading-relaxed font-medium">
                               {selectedIncident.copilot_summary || "Analyzing incident context..."}
                            </p>
                         </div>

                         <div className="grid grid-cols-2 gap-8">
                            <div>
                               <p className="text-[10px] font-mono opacity-50 mb-3 uppercase tracking-widest">Recommended Actions</p>
                               <div className="space-y-3">
                                  {selectedIncident.copilot_steps ? JSON.parse(selectedIncident.copilot_steps).map((step: string, i: number) => (
                                    <div key={i} className="flex gap-3 text-xs opacity-90 group/step">
                                       <span className="text-indigo-400 font-mono">0{i+1}.</span>
                                       <p className="group-hover/step:translate-x-1 transition-transform">{step}</p>
                                    </div>
                                  )) : <p className="text-xs opacity-50">Generating resolution pathway...</p>}
                               </div>
                            </div>
                            <div>
                               <p className="text-[10px] font-mono opacity-50 mb-3 uppercase tracking-widest">Long-term Prevention</p>
                               <div className="space-y-3">
                                  {selectedIncident.copilot_recommendations ? JSON.parse(selectedIncident.copilot_recommendations).map((rec: string, i: number) => (
                                    <div key={i} className="flex gap-2 items-start text-xs opacity-80 italic">
                                       <CornerDownRight size={14} className="text-purple-400 mt-0.5" />
                                       <p>{rec}</p>
                                    </div>
                                  )) : <p className="text-xs opacity-50">Calculating risk mitigation...</p>}
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Similar Incidents Section */}
                <div className="mt-8">
                   <p className="text-[10px] font-mono opacity-50 mb-4 uppercase tracking-widest font-bold">Recommended Past Resolutions</p>
                   <SimilarIncidents current={selectedIncident} all={incidents} />
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Footer / Stats Bar */}
      <footer className="h-10 border-t border-[#D1D1CF] bg-white flex items-center px-8 justify-between">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">System Operational</span>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">Total Incidents:</span>
               <span className="text-[10px] font-mono font-bold">{incidents.length}</span>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono opacity-50 uppercase tracking-widest">Node: sentinel-cluster-01a</span>
            <div className="h-4 w-[1px] bg-[#D1D1CF]" />
            <span className="text-[10px] font-mono opacity-50 uppercase tracking-widest">v2.4.0-stable</span>
         </div>
      </footer>

      {/* New Incident Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-8">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden technical-border"
            >
              <div className="px-8 py-6 border-b border-[#D1D1CF] flex items-center justify-between bg-[#F9F9F8]">
                 <div>
                    <h3 className="font-bold uppercase tracking-tight">Report New Incident</h3>
                    <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest font-bold">Automatic AI Classification Enabled</p>
                 </div>
                 <button onClick={() => setIsFormOpen(false)} className="hover:opacity-50"><X size={20} /></button>
              </div>

              <form onSubmit={handleCreate} className="p-8 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-50">Subject Title</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g., Primary database latency spikes in US-EAST-1"
                      className="w-full bg-[#F0F0EE] border-none rounded p-3 text-sm focus:ring-1 focus:ring-black outline-none placeholder:opacity-30"
                      value={newIncident.title}
                      onChange={e => setNewIncident({...newIncident, title: e.target.value})}
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-50">Detailed Narrative</label>
                    <textarea 
                      required
                      rows={4}
                      placeholder="Provide full context, logs, or error messages..."
                      className="w-full bg-[#F0F0EE] border-none rounded p-3 text-sm focus:ring-1 focus:ring-black outline-none resize-none placeholder:opacity-30"
                      value={newIncident.description}
                      onChange={e => setNewIncident({...newIncident, description: e.target.value})}
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-50">Initial Severity</label>
                       <select 
                         className="w-full bg-[#F0F0EE] border-none rounded p-3 text-sm focus:ring-1 focus:ring-black outline-none uppercase"
                         value={newIncident.severity}
                         onChange={e => setNewIncident({...newIncident, severity: e.target.value as Severity})}
                       >
                         <option value="Low">Low - Minor Impact</option>
                         <option value="Medium">Medium - Normal Operations affected</option>
                         <option value="High">High - Critical Infrastructure Failure</option>
                       </select>
                    </div>
                    <div className="flex flex-col justify-end">
                       <div className="p-3 bg-indigo-50 rounded border border-indigo-100 flex items-center gap-3">
                          <BrainCircuit size={16} className="text-indigo-600" />
                          <p className="text-[9px] text-indigo-700 leading-tight font-medium">AI will analyze your description to automatically classify the category and prioritize resolution order.</p>
                       </div>
                    </div>
                 </div>

                 <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#D1D1CF]">
                    <button 
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-6 py-2.5 rounded text-xs font-bold uppercase hover:bg-[#E8E8E6] transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      disabled={isAnalyzing}
                      type="submit"
                      className="flex items-center gap-2 bg-black text-white px-8 py-2.5 rounded text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-all disabled:opacity-50"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        "Deploy Report"
                      )}
                    </button>
                 </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CategoryIcon({ category, className }: { category: Category, className?: string }) {
  const icons = {
    IT: Monitor,
    Network: Network,
    Security: Shield,
    Hardware: Cpu,
    Software: Server,
    Other: AlertCircle,
  };
  const Icon = icons[category] || icons.Other;
  return <Icon size={14} className={className} />;
}

function SimilarIncidents({ current, all }: { current: Incident, all: Incident[] }) {
  const [recommendations, setRecommendations] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRecs = async () => {
      setLoading(true);
      try {
        const past = all.filter(i => i.id !== current.id);
        const recs = await aiService.getRecommendations(current, past);
        setRecommendations(recs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecs();
  }, [current.id, all.length]);

  if (loading) return <div className="text-[10px] font-mono opacity-50">SCANNING DATABASE FOR SIMILAR PATTERNS...</div>;
  if (recommendations.length === 0) return <div className="text-[10px] font-mono opacity-50">NO SIGNIFICANT SIMILARITIES DETECTED.</div>;

  return (
    <div className="grid grid-cols-1 gap-2">
      {recommendations.map(rec => (
        <div key={rec.id} className="p-4 bg-white technical-border rounded flex flex-col gap-2 hover:bg-[#E8E8E6] transition-colors cursor-pointer group">
          <div className="flex items-center justify-between">
             <span className="data-value opacity-50">#{rec.id.slice(-4)}</span>
             <Badge variant={rec.severity}>{rec.severity}</Badge>
          </div>
          <h4 className="text-sm font-bold truncate leading-none">{rec.title}</h4>
          <p className="text-[10px] opacity-60 truncate">{rec.description}</p>
          <div className="pt-2 border-t border-[#D1D1CF] mt-1 hidden group-hover:block">
             <p className="text-[9px] font-bold uppercase opacity-50 mb-1">AI Recommendation Context:</p>
             <p className="text-[10px] italic leading-tight opacity-70">"This incident involves similar resources and root causes. Refer to the resolved steps in the audit log for ID #{rec.id.slice(-4)}."</p>
          </div>
        </div>
      ))}
    </div>
  );
}
