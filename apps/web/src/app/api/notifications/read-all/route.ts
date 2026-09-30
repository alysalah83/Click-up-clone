import { proxy } from "@/shared/lib/apiProxy";

export const POST = () => proxy((axios) => axios.post("/notifications/read-all"));
