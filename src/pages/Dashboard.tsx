import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Truck, FolderOpen, DollarSign, AlertCircle } from "lucide-react";
import { handleFirestoreError, OperationType } from "../lib/firestore-error";

import { useSettings } from "../hooks/useSettings";

export default function Dashboard() {
  const { settings } = useSettings();
  const [stats, setStats] = useState({
    dossiersActifs: 0,
    chargementsSemaine: 0,
    montantDu: 0,
    creancesEchues: 0,
  });

  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const unsubD = onSnapshot(collection(db, "dossiers"), (snap) => {
      let actifs = 0;
      const dossiersData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      actifs = dossiersData.filter((d: any) => d.statut === "en_cours").length;
      setStats(s => ({ ...s, dossiersActifs: actifs }));
    });
    unsubs.push(unsubD);

    const unsubC = onSnapshot(collection(db, "chargements"), (snap) => {
      let du = 0;
      let semaine = 0;
      let echues = 0;
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      snap.forEach(doc => {
        const data = doc.data();
        if (data.statutPaiement === "non_paye") {
          du += data.solde || 0;
          if (data.createdAt && new Date(data.createdAt) < oneWeekAgo) {
            echues++;
          }
        }

        if (data.dateChargement && new Date(data.dateChargement) > oneWeekAgo) {
          semaine++;
        }
      });

      setStats(s => ({ ...s, montantDu: du, chargementsSemaine: semaine, creancesEchues: echues }));
    });
    unsubs.push(unsubC);

    return () => unsubs.forEach(u => u());
  }, []);

  return (
    <div className="space-y-6">
      <div className="mb-10">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter font-display">
          Pilotage <span className="text-blue-600">Stratégique</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Analyse en temps réel de la chaîne d'approvisionnement</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Dossiers Actifs" 
          value={stats.dossiersActifs} 
          icon={FolderOpen} 
          color="bg-blue-600" 
        />
        <StatCard 
          title="Chargements (7j)" 
          value={stats.chargementsSemaine} 
          icon={Truck} 
          color="bg-slate-800" 
        />
        <StatCard 
          title="Créances à Solder" 
          value={`${stats.montantDu.toLocaleString()} ${settings.devise}`} 
          icon={DollarSign} 
          color="bg-emerald-600" 
        />
        <StatCard 
          title="Créances Échues" 
          value={stats.creancesEchues} 
          icon={AlertCircle} 
          color="bg-rose-600" 
          highlight={stats.creancesEchues > 0}
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, highlight = false }: { title: string, value: string | number, icon: any, color: string, highlight?: boolean }) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none p-8 flex flex-col gap-6 transition-all duration-300 group border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 ${highlight ? 'ring-2 ring-rose-500 border-transparent animate-pulse' : ''}`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110 duration-300 ${color}`}>
        <Icon className="w-8 h-8" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">{title}</p>
        <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums truncate">{value}</p>
      </div>
    </div>
  );
}
