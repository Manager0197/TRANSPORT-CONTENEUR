import React, { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, addDoc, updateDoc, doc, query, orderBy, where, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Plus, ChevronDown, ChevronUp, Truck, FolderOpen, Search, Trash2, Edit2, Check, X as XIcon } from "lucide-react";
import { handleFirestoreError, OperationType } from "../lib/firestore-error";
import ConfirmModal from "../components/ConfirmModal";

export default function Dossiers() {
  const [dossiers, setDossiers] = useState<any[]>([]);
  const [camions, setCamions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNew, setShowNew] = useState(false);
  const [newDossier, setNewDossier] = useState({ numeroBL: "", nbConteneurs: 1, prixContrat: 0, typeTransport: "interne" });

  useEffect(() => {
    const q = query(collection(db, "dossiers"), orderBy("createdAt", "desc"));
    const unsubD = onSnapshot(q, (snap) => {
      setDossiers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "dossiers");
    });

    const unsubC = onSnapshot(collection(db, "camions"), snap => {
      setCamions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "camions");
    });

    return () => { unsubD(); unsubC(); };
  }, []);

  const filteredDossiers = useMemo(() => {
    return dossiers.filter(d => {
      const matchesSearch = d.numeroBL.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || d.statut === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [dossiers, searchTerm, statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDossier.numeroBL) return;

    try {
      await addDoc(collection(db, "dossiers"), {
        numeroBL: newDossier.numeroBL,
        nbConteneurs: newDossier.nbConteneurs,
        prixContrat: newDossier.prixContrat,
        typeTransport: newDossier.typeTransport,
        statut: "en_cours",
        dateCreation: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setShowNew(false);
      setNewDossier({ numeroBL: "", nbConteneurs: 1, prixContrat: 0, typeTransport: "interne" });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "dossiers");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter font-display">
            Point d'Entrée <span className="text-blue-600">Numérique</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Gestion et ingestion matricielle des dossiers connaissements (BL)</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button 
            onClick={() => setShowNew(true)}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" /> Saisie matricielle
          </button>
          <button className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold transition-all active:scale-95">
             Ingestion groupée
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 transition-colors">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Recherche par N° BL..." 
            className="w-full pl-10 pr-4 py-3 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none font-bold placeholder:text-slate-400 dark:placeholder:text-slate-600"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <div className="absolute left-3.5 top-3.5 text-slate-400">
            <Search className="w-5 h-5" />
          </div>
        </div>
        <select 
          className="w-full border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none font-bold"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">Tous les statuts opérationnels</option>
          <option value="en_cours">En cours (Flux Ouvert)</option>
          <option value="cloture">Clôturé (Archives)</option>
        </select>
        <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest">
          <Truck className="w-4 h-4 text-blue-500" />
          <span>{filteredDossiers.length} Unités logiques</span>
        </div>
      </div>

      {showNew && (
        <form onSubmit={handleCreate} className="bg-slate-900 p-6 rounded-2xl shadow-xl flex flex-col gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="w-full">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Saisie matricielle (N° BL)</label>
              <input 
                type="text" 
                placeholder="Ex: #2024-045"
                required
                className="w-full bg-slate-800 text-white border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                value={newDossier.numeroBL}
                onChange={e => setNewDossier({...newDossier, numeroBL: e.target.value})}
              />
            </div>
            <div className="w-full">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Ingestion groupée (EVP)</label>
              <input 
                type="number" 
                min="1"
                required
                className="w-full bg-slate-800 text-white border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={Number.isNaN(newDossier.nbConteneurs) ? "" : newDossier.nbConteneurs}
                onChange={e => setNewDossier({...newDossier, nbConteneurs: parseInt(e.target.value)})}
              />
            </div>
            <div className="w-full">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Montant Contrat Client</label>
              <input 
                type="number" 
                min="0"
                required
                className="w-full bg-slate-800 text-white border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={newDossier.prixContrat}
                onChange={e => setNewDossier({...newDossier, prixContrat: parseInt(e.target.value) || 0})}
              />
            </div>
            <div className="w-full">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Mode Logistique cible</label>
              <select 
                className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={newDossier.typeTransport}
                onChange={e => setNewDossier({...newDossier, typeTransport: e.target.value})}
              >
                <option value="interne text-emerald-400">Flotte Interne (Camion + Chauffeur)</option>
                <option value="externe text-amber-400">Sous-traitance (Prestation Tiers)</option>
                <option value="mixte text-blue-400">Allocation Hybride / Mixte</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 text-sm font-bold">
            <button type="button" onClick={() => setShowNew(false)} className="px-6 py-3 text-slate-400 hover:text-white transition-colors">
              Annuler
            </button>
            <button type="submit" className="bg-blue-600 text-white px-10 py-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
              Valider l'ouverture
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {filteredDossiers.map(dossier => (
          <DossierCard key={dossier.id} dossier={dossier} camions={camions} />
        ))}
        {filteredDossiers.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-100">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
               <FolderOpen className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Moteur d'investigation : Aucun résultat</h3>
            <p className="text-slate-500 font-medium">Afin d'obtenir des résultats, vérifiez les critères de recherche.</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface DossierCardProps {
  dossier: any;
  camions: any[];
  key?: any;
}

function DossierCard({ dossier, camions }: DossierCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [conteneurs, setConteneurs] = useState<any[]>([]);
  const [chargements, setChargements] = useState<any[]>([]);

  useEffect(() => {
    if (!expanded) return;
    
    const unsubC = onSnapshot(query(collection(db, "conteneurs"), where("dossierId", "==", dossier.id)), snap => {
      setConteneurs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "conteneurs");
    });
    
    const unsubCh = onSnapshot(query(collection(db, "chargements"), where("dossierId", "==", dossier.id)), snap => {
      setChargements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "chargements");
    });

    return () => { unsubC(); unsubCh(); };
  }, [expanded, dossier.id]);

  const toggleStatus = async () => {
    try {
      await updateDoc(doc(db, "dossiers", dossier.id), {
        statut: dossier.statut === "en_cours" ? "cloture" : "en_cours",
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `dossiers/${dossier.id}`);
    }
  };

  const handleDeleteDossier = async () => {
    try {
      await deleteDoc(doc(db, "dossiers", dossier.id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `dossiers/${dossier.id}`);
    }
  };

  const handleDeleteChargement = async () => {
    if (!deleteChargementData) return;
    try {
      await deleteDoc(doc(db, "chargements", deleteChargementData.id));
      if (deleteChargementData.conteneurId) {
        await deleteDoc(doc(db, "conteneurs", deleteChargementData.conteneurId));
      }
      setDeleteChargementData(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `chargements/${deleteChargementData.id}`);
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    numeroBL: dossier.numeroBL,
    nbConteneurs: dossier.nbConteneurs,
    prixContrat: dossier.prixContrat
  });
  const [showDeleteDossier, setShowDeleteDossier] = useState(false);
  const [deleteChargementData, setDeleteChargementData] = useState<{id: string, conteneurId?: string} | null>(null);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "dossiers", dossier.id), {
        ...editForm,
        updatedAt: new Date().toISOString()
      });
      setIsEditing(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `dossiers/${dossier.id}`);
    }
  };

  const stats = useMemo(() => {
    const totalChargements = chargements.length;
    const totalPrix = chargements.reduce((sum, ch) => sum + (ch.prixTotal || 0), 0);
    const totalAvance = chargements.reduce((sum, ch) => sum + (ch.avance || 0), 0);
    const totalSolde = chargements.reduce((sum, ch) => sum + (ch.solde || 0), 0);
    const progresses = (totalChargements / (dossier.nbConteneurs || 1)) * 100;
    const marge = (dossier.prixContrat || 0) - totalPrix;
    
    return {
      totalChargements,
      totalPrix,
      totalAvance,
      totalSolde,
      marge,
      progress: Math.min(progresses, 100),
      isComplete: totalChargements >= (dossier.nbConteneurs || 1)
    };
  }, [chargements, dossier.nbConteneurs, dossier.prixContrat]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden transition-all hover:border-blue-500/30 group">
      <div 
        className="p-6 sm:p-8 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className={`p-4 sm:p-5 rounded-2xl flex-shrink-0 transition-transform group-hover:scale-110 duration-300 ${dossier.statut === 'en_cours' ? 'bg-blue-600/10 text-blue-600 border border-blue-600/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}>
              <FolderOpen className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                {isEditing ? (
                  <form onSubmit={handleEdit} className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <input 
                      type="text" 
                      className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2 py-1 text-sm font-bold text-slate-900 dark:text-white"
                      value={editForm.numeroBL}
                      onChange={e => setEditForm({...editForm, numeroBL: e.target.value})}
                      autoFocus
                    />
                    <button type="submit" className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => setIsEditing(false)} className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">
                      <XIcon className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <>
                    <h3 className="text-base sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter truncate max-w-[120px] sm:max-w-none">BL #{dossier.numeroBL}</h3>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                      className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </>
                )}
                <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] shadow-sm whitespace-nowrap ${dossier.statut === 'en_cours' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {dossier.statut === 'en_cours' ? 'Flux Ouvert' : 'Clôturé'}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Plan de charge : <span className="text-blue-600">{stats.totalChargements}</span> / {isEditing ? (
                  <input 
                    type="number" 
                    className="w-12 bg-transparent border-b border-blue-500/30 text-blue-600 focus:outline-none"
                    value={editForm.nbConteneurs}
                    onClick={e => e.stopPropagation()}
                    onChange={e => setEditForm({...editForm, nbConteneurs: parseInt(e.target.value)})}
                  />
                ) : dossier.nbConteneurs} EVP
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowDeleteDossier(true); }}
              className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-500/5 rounded-xl transition-all"
              title="Supprimer définitivement"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <div className="hidden lg:block w-48">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase mb-1">
                <span>Progression</span>
                <span>{Math.round(stats.progress)}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${stats.isComplete ? 'bg-emerald-500' : 'bg-blue-500'}`}
                  style={{ width: `${stats.progress}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        </div>

        {/* Mobile Mini Progress Bar */}
        <div className="mt-4 lg:hidden h-1 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${stats.isComplete ? 'bg-emerald-500' : 'bg-blue-500'}`}
            style={{ width: `${stats.progress}%` }}
          />
        </div>
      </div>

      {expanded && (
        <div className="p-6 sm:p-10 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 transition-colors">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-4">Coût Logistique</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{stats.totalPrix.toLocaleString()} F</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-4">Engagements / Avances</p>
              <p className="text-2xl font-black text-emerald-500 tabular-nums">{stats.totalAvance.toLocaleString()} F</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-4">Solde Net Passif</p>
              <p className="text-2xl font-black text-rose-500 tabular-nums">{stats.totalSolde.toLocaleString()} F</p>
            </div>
            <div className="bg-slate-950 p-6 rounded-2xl border border-blue-500/20 shadow-lg shadow-blue-500/10">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">P&L par rotation (NET)</p>
              <p className={`text-2xl font-black tabular-nums transition-colors ${stats.marge >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stats.marge.toLocaleString()} F
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-blue-600 rounded-full" />
              <h4 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tighter">Manifeste d'Expédition</h4>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button 
                onClick={(e) => { e.stopPropagation(); toggleStatus(); }} 
                className="flex-1 sm:flex-none text-xs px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 bg-white font-medium shadow-sm transition-colors"
              >
                {dossier.statut === 'en_cours' ? 'Clôturer Dossier' : 'Réouvrir Dossier'}
              </button>
              <div className="flex-1 sm:flex-none">
                <AddChargementModal dossier={dossier} camions={camions} />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {chargements.map(ch => (
              <div key={ch.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center group/item hover:border-blue-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <Truck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-tight">
                      {ch.typeTransporteur === 'interne' ? `Camion: ${camions.find(c => c.id === ch.camionId)?.numero || ch.camionId}` : `Prestataire: ${ch.nomTransporteurExterne}`}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">EVP ID: {ch.numeroConteneur || ch.conteneurId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-black text-xs text-slate-900 dark:text-white tabular-nums">{ch.prixTotal?.toLocaleString()} F</p>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Avance: {ch.avance?.toLocaleString()} F</p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteChargementData({ id: ch.id, conteneurId: ch.conteneurId });
                    }}
                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover/item:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {chargements.length === 0 && (
              <p className="text-sm font-bold text-slate-400 text-center py-4 uppercase tracking-[0.2em]">Flux logistique vierge</p>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteDossier}
        onClose={() => setShowDeleteDossier(false)}
        onConfirm={handleDeleteDossier}
        title="Supprimer le dossier BL"
        message="Cette action supprimera définitivement le dossier. Note : les chargements associés devront être gérés séparément pour une intégrité parfaite de la base."
        confirmText="Supprimer le dossier"
      />

      <ConfirmModal
        isOpen={!!deleteChargementData}
        onClose={() => setDeleteChargementData(null)}
        onConfirm={handleDeleteChargement}
        title="Supprimer le chargement"
        message="Voulez-vous vraiment retirer ce conteneur de ce dossier ? Cette action libérera l'unité de transport mais supprimera l'historique de ce chargement spécifique."
        confirmText="Supprimer le chargement"
      />
    </div>
  );
}

function AddChargementModal({ dossier, camions: externalCamions }: { dossier: any; camions?: any[] }) {
  const [open, setOpen] = useState(false);
  const [localCamions, setLocalCamions] = useState<any[]>([]);
  const camions = externalCamions || localCamions;
  const [partenaires, setPartenaires] = useState<any[]>([]);
  const [form, setForm] = useState({
    numeroConteneur: "",
    typeConteneur: "20'",
    typeTransporteur: "interne",
    camionId: "",
    nomTransporteurExterne: "",
    avance: 0,
    prixTotal: 0
  });

  useEffect(() => {
    if (open) {
      let unsubC = () => {};
      if (!externalCamions) {
        unsubC = onSnapshot(collection(db, "camions"), snap => {
          setLocalCamions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, "camions");
        });
      }

      const unsubP = onSnapshot(collection(db, "partenaires"), snap => {
        setPartenaires(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "partenaires");
      });

      return () => { unsubC(); unsubP(); };
    }
  }, [open, externalCamions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create conteneur first
      const contRef = await addDoc(collection(db, "conteneurs"), {
        numero: form.numeroConteneur,
        dossierId: dossier.id,
        type: form.typeConteneur,
        createdAt: new Date().toISOString()
      });

      // Create chargement
      await addDoc(collection(db, "chargements"), {
        dossierId: dossier.id,
        conteneurId: contRef.id,
        numeroConteneur: form.numeroConteneur,
        typeTransporteur: form.typeTransporteur,
        camionId: form.typeTransporteur === 'interne' ? form.camionId : null,
        nomTransporteurExterne: form.typeTransporteur === 'externe' ? form.nomTransporteurExterne : null,
        avance: form.avance,
        prixTotal: form.prixTotal,
        solde: form.prixTotal - form.avance,
        statutPaiement: (form.prixTotal - form.avance) <= 0 ? "paye" : "non_paye",
        dateChargement: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
      
      setOpen(false);
      setForm({ numeroConteneur: "", typeConteneur: "20'", typeTransporteur: "interne", camionId: "", nomTransporteurExterne: "", avance: 0, prixTotal: 0 });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "chargements");
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700">
        Ajouter Chargement
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">Nouveau Chargement</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">N° Conteneur</label>
              <input required type="text" className="w-full border rounded-lg px-3 py-2" value={form.numeroConteneur} onChange={e => setForm({...form, numeroConteneur: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type de Conteneur</label>
              <select className="w-full border rounded-lg px-3 py-2" value={form.typeConteneur} onChange={e => setForm({...form, typeConteneur: e.target.value})}>
                <option value="20'">20 Pieds</option>
                <option value="40'">40 Pieds</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Mode Opérationnel</label>
            <select className="w-full border rounded-lg px-3 py-2" value={form.typeTransporteur} onChange={e => setForm({...form, typeTransporteur: e.target.value})}>
              <option value="interne">Flotte Interne (Maîtrise direct)</option>
              <option value="externe">Sous-traitance (Prestation déléguée)</option>
            </select>
          </div>

          {form.typeTransporteur === 'interne' ? (
            <div>
              <label className="block text-sm font-medium mb-1">Camion (Propriétaire)</label>
              <select required className="w-full border rounded-lg px-3 py-2" value={form.camionId} onChange={e => setForm({...form, camionId: e.target.value})}>
                <option value="">Sélectionner un camion...</option>
                {camions.map(c => <option key={c.id} value={c.id}>{c.numero}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1">Entreprise Prestataire</label>
              <select required className="w-full border rounded-lg px-3 py-2" value={form.nomTransporteurExterne} onChange={e => setForm({...form, nomTransporteurExterne: e.target.value})}>
                <option value="">Sélectionner une entreprise...</option>
                {partenaires.map(p => <option key={p.id} value={p.nom}>{p.nom}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Prix Total / Engagement (FCFA)</label>
              <input required type="number" min="0" className="w-full border rounded-lg px-3 py-2" value={form.prixTotal} onChange={e => setForm({...form, prixTotal: parseInt(e.target.value) || 0})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Avance / Provision (FCFA)</label>
              <input required type="number" min="0" className="w-full border rounded-lg px-3 py-2" value={form.avance} onChange={e => setForm({...form, avance: parseInt(e.target.value) || 0})} />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
}
