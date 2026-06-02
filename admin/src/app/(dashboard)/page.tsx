"use client";
import { useCallback, useEffect, useState } from "react";
import { Activity, CreditCard, Shirt, Sparkles, TrendingUp, Users, Wand2, Wallet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header"; import { KpiCard } from "@/components/shared/kpi-card"; import { ResourceState } from "@/components/shared/resource-state";
import { apiFetch } from "@/lib/api/client"; import { formatNumber, formatVnd } from "@/lib/utils"; import type { DashboardKpis } from "@/types/database";
export default function Page() {
 const [k,setK]=useState<DashboardKpis>(); const [error,setError]=useState(""); const [loading,setLoading]=useState(true);
 const load=useCallback(async()=>{setLoading(true);setError("");try{setK((await apiFetch<{kpis:DashboardKpis}>("/api/dashboard")).kpis)}catch(e){setError(e instanceof Error?e.message:"Không thể tải KPI")}finally{setLoading(false)}},[]);
 useEffect(()=>{void load()},[load]); if(loading||error||!k)return <><PageHeader title="Dashboard" description="Firestore real-time overview"/><ResourceState loading={loading} error={error} onRetry={()=>void load()}/></>;
 const cards:[[string,string,typeof Users],...Array<[string,string,typeof Users]>]=[["Tổng người dùng",formatNumber(k.totalUsers),Users],["Active users",formatNumber(k.activeUsers),Activity],["Premium users",formatNumber(k.premiumUsers),Sparkles],["AI usage hôm nay",formatNumber(k.dailyAiUsage),Wand2],["Giao dịch cộng đồng",formatNumber(k.communityTransactions),CreditCard],["Doanh thu",formatVnd(k.revenueVnd),Wallet],["Hoa hồng",formatVnd(k.commissionVnd),TrendingUp],["Outfit generations",formatNumber(k.outfitGenerations),Shirt]];
 return <div><PageHeader title="Dashboard" description="Firestore real-time overview"/><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label,value,icon])=><KpiCard key={label} label={label} value={value} icon={icon}/>)}</div></div>;
}
