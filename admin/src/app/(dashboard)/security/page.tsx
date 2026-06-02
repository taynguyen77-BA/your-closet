import { AdminCollectionPage } from "@/components/shared/admin-collection-page";
export default function Page(){return <AdminCollectionPage config={{collection:"admin_logs",title:"Audit logs",description:"Admin security audit trail",fields:[{key:"adminId",label:"Admin"},{key:"action",label:"Action"},{key:"resourceId",label:"Resource"},{key:"createdAt",label:"Created"}]}}/>}
