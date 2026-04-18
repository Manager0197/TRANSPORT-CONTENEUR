import React, { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, addDoc, updateDoc, doc, query, orderBy, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Plus, Truck, Trash2, Edit2, Check, X as XIcon } from "lucide-react";
import { handleFirestoreError, OperationType } from "../lib/firestore-error";
import ConfirmModal from "../components/ConfirmModal";

export default function Camions() {
  const [camions, setCamions] = useState<any[]>([]);
  const [chargements, setChargements] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newCamion, setNewCamion] = useState({ numero: "", chauffeur: "" });
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const q = query(collection(db, "camions"), orderBy("createdAt", "desc"));
    const unsubCamions = onSnapshot(q, (snap) => {
      setCamions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "camions");
    });
    
    const unsubChargements = onSnapshot(collection(db, "chargements"), (snap) => {
      setChargements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "chargements");
    });

    return () => { unsubCamions(); unsubChargements(); };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCamion.numero) return;

    try {
      await addDoc(collection(db, "camions"), {
        numero: newCamion.numero,
        chauffeur: newCamion.chauffeur,
        statut: "actif",
        createdAt: new Date().toISOString()
      });
      setShowNew(false);
      setNewCamion({ numero: "", chauffeur: "" });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "camions");
    }
  };

  const toggleStatut = async (id: string, currentStatut: string) => {
    try {
      await updateDoc(doc(db, "camions", id), {
        statut: currentStatut === 'actif' ? 'inactif' : 'actif',
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `camions/${id}`);
    }
  };

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ numero: "", chauffeur: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleEdit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "camions", id), {
        ...editForm,
        updatedAt: new Date().toISOString()
      });
      setIsEditing(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `camions/${id}`);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDoc(doc(db, "camions", deleteId));
      setDeleteId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `camions/${deleteId}`);
    }
  };

  const getCamionStats = (camionId: string) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Total Volume (Inception)
    const cumulativeVolume = chargements.filter(ch => ch.camionId === camionId).length;
    
    // Monthly Activity (M-1)
    const monthlyActivity = chargements.filter(ch => {
      if (ch.camionId !== camionId || !ch.dateChargement) return false;
      const date = new Date(ch.dateChargement);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;
    
    // Semestrial Activity (S-1)
    const semestrialActivity = chargements.filter(ch => {
      if (ch.camionId !== camionId || !ch.dateChargement) return false;
      const date = new Date(ch.dateChargement);
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 180;
    }).length;

    // Financials
    const filteredForFinancials = chargements.filter(ch => ch.camionId === camionId);
    const provisionsConsommees = filteredForFinancials.reduce((sum, ch) => sum + (ch.avance || 0), 0);
    const encoursCreances = filteredForFinancials.reduce((sum, ch) => sum + (ch.solde || 0), 0);

    return { cumulativeVolume, monthlyActivity, semestrialActivity, provisionsConsommees, encoursCreances };
  };

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 rounded-[2rem] p-10 border border-blue-500/20 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-blue-500/10 group-hover:scale-110 transition-transform duration-700">
            <Truck className="w-48 h-48 -mr-12 -mt-12" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
               <div className="p-3 rounded-xl bg-blue-600/20 text-blue-400">
                  <Truck className="w-6 h-6" />
               </div>
               <div>
                  <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-0.5">LOGISTIQUE PRIORITAIRE</h3>
                  <h4 className="text-2xl font-black text-white uppercase tracking-tight">Flotte Propriétaire</h4>
               </div>
            </div>
            <ul className="space-y-4">
              {["Nomenclature des véhicules standardisée", "Intégration native dans le MDM", "Télémétrie des chargements affectés", "Bilans périodiques automatisés", "Audit comptable des avances", "Fiches P&L analytiques individuelles"].map(item => (
                <li key={item} className="flex items-center gap-3 text-slate-400 text-sm font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[2rem] p-10 border border-amber-500/20 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-amber-500/10 group-hover:scale-110 transition-transform duration-700">
             <div className="w-48 h-48 -mr-12 -mt-12 flex items-center justify-center">
                <Plus className="w-32 h-32" />
             </div>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
               <div className="p-3 rounded-xl bg-amber-600/20 text-amber-400">
                  <Plus className="w-6 h-6" />
               </div>
               <div>
                  <h3 className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] mb-0.5">RÉSEAU ÉLARGI</h3>
                  <h4 className="text-2xl font-black text-white uppercase tracking-tight">Sous-traitance Tiers</h4>
               </div>
            </div>
            <ul className="space-y-4">
              {["Sourcing dynamique des partenaires", "Onboarding just-in-time", "Extensibilité de la base fournisseurs", "Traçabilité financière par contrat BL", "Gestion des décaissements délégués", "Consolidation des charges indirectes"].map(item => (
                <li key={item} className="flex items-center gap-3 text-slate-400 text-sm font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 transition-colors">
        <div className="flex items-center gap-6">
          <div className="h-12 w-3 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]" />
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tighter font-display text-slate-900 dark:text-white">Exploitation : <span className="text-blue-600">Unités Flotte</span></h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Gestion du matériel roulant et des affectations chauffeurs</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button 
            onClick={() => setShowNew(true)}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-xs tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-5 h-5" /> Ajouter un Camion
          </button>
        </div>
      </div>

      {showNew && (
        <form onSubmit={handleCreate} className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 sm:items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-slate-700 mb-1">Immatriculation / N° Camion</label>
            <input 
              type="text" 
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              value={newCamion.numero}
              onChange={e => setNewCamion({...newCamion, numero: e.target.value})}
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-slate-700 mb-1">Transporteur Interne (Chauffeur)</label>
            <input 
              type="text" 
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              value={newCamion.chauffeur}
              onChange={e => setNewCamion({...newCamion, chauffeur: e.target.value})}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button type="submit" className="flex-1 sm:flex-none bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800">
              Ajouter
            </button>
            <button type="button" onClick={() => setShowNew(false)} className="flex-1 sm:flex-none text-slate-500 px-4 py-2 hover:bg-slate-100 rounded-lg border border-slate-200 sm:border-none">
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-12">
        {camions.map(camion => {
          const stats = getCamionStats(camion.id);
          return (
            <div key={camion.id} className="bg-slate-950 rounded-[2rem] border border-slate-800 overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                 <div className="flex items-center gap-6">
                    <div className="p-4 rounded-2xl bg-blue-600/10 text-blue-600 border border-blue-500/20">
                      <Truck className="w-10 h-10" />
                    </div>
                    <div>
                      <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-1">TABLEAU DE BORD : UNITÉ FLOTTE</h2>
                      {isEditing === camion.id ? (
                        <form onSubmit={(e) => handleEdit(e, camion.id)} className="flex items-center gap-3">
                          <input 
                            className="bg-slate-800 border-none rounded-xl px-4 py-2 text-xl font-black text-white"
                            value={editForm.numero}
                            onChange={e => setEditForm({...editForm, numero: e.target.value})}
                            autoFocus
                          />
                          <button type="submit" className="p-2 bg-emerald-500 text-white rounded-xl">
                            <Check className="w-5 h-5" />
                          </button>
                          <button type="button" onClick={() => setIsEditing(null)} className="p-2 bg-slate-800 text-slate-400 rounded-xl">
                            <XIcon className="w-5 h-5" />
                          </button>
                        </form>
                      ) : (
                        <div className="flex items-center gap-4">
                          <h3 className="text-4xl font-black text-white uppercase tracking-tighter">{camion.numero}</h3>
                          <button 
                            onClick={() => { setIsEditing(camion.id); setEditForm({ numero: camion.numero, chauffeur: camion.chauffeur }); }}
                            className="p-2 text-slate-500 hover:text-blue-500 transition-colors"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setDeleteId(camion.id)}
                    className="p-3 text-slate-600 hover:text-rose-500 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                  <button 
                      onClick={() => toggleStatut(camion.id, camion.statut)}
                      className={`px-6 py-2 rounded-xl font-bold text-sm tracking-wide transition-all ${camion.statut === 'actif' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}
                    >
                      STATUS : {camion.statut?.toUpperCase()}
                    </button>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <div className="p-10 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center group hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all duration-300">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-8">TRANSPORT ASSIGNÉ</p>
                  <div className="relative mb-6">
                    {isEditing === camion.id ? (
                      <input 
                        className="bg-slate-800 border-none rounded-xl px-4 py-2 text-2xl font-black text-white text-center"
                        value={editForm.chauffeur}
                        onChange={e => setEditForm({...editForm, chauffeur: e.target.value})}
                      />
                    ) : (
                      <p className="text-3xl font-black text-white group-hover:scale-110 transition-transform duration-500 uppercase">
                        {camion.chauffeur || "NON ASSIGNÉ"}
                      </p>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Chauffeur Interne</p>
                </div>
                <StatBox 
                  label="VOLUME CUMULÉ" 
                  value={stats.cumulativeVolume} 
                  subtext="Missions depuis inception"
                />
                <StatBox 
                  label="ACTIVITÉ MENSUELLE" 
                  value={stats.monthlyActivity} 
                  subtext="Missions sur M-1"
                />
                <StatBox 
                   label="ACTIVITÉ SEMESTRIELLE" 
                   value={stats.semestrialActivity} 
                   subtext="Missions sur S-1"
                />
                <StatBox 
                  label="PROVISIONS CONSOMMÉES" 
                  value={`${(stats.provisionsConsommees / 1000000).toFixed(1)}M`} 
                  subtext="Total net (XOF)"
                  highlight
                />
                <StatBox 
                  label="ENCOURS CRÉANCES" 
                  value={`${(stats.encoursCreances / 1000).toFixed(0)}K`} 
                  subtext="Solde passif (XOF)"
                  highlightColor="text-rose-500"
                />
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Supprimer l'unité de flotte"
        message="Attention : cette action est irréversible. Toutes les statistiques et l'historique liés à ce camion seront conservés dans les chargements, mais l'unité ne sera plus disponible pour de nouvelles affectations."
        confirmText="Supprimer définitivement"
        variant="danger"
      />
    </div>
  );
}

function StatBox({ 
  label, 
  value, 
  subtext, 
  highlight = false, 
  highlightColor = "text-emerald-500",
  icon: Icon
}: { 
  label: string, 
  value: string | number, 
  subtext: string, 
  highlight?: boolean, 
  highlightColor?: string,
  icon?: any
}) {
  return (
    <div className="p-10 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center group hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all duration-300">
      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-8">{label}</p>
      <div className="relative mb-6">
        <p className={`text-5xl sm:text-6xl font-black tracking-tighter transition-transform group-hover:scale-110 duration-500 tabular-nums ${highlight ? highlightColor : "text-slate-900 dark:text-white"}`}>
          {value}
        </p>
      </div>
      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{subtext}</p>
    </div>
  );
}
