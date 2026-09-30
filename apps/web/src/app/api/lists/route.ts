import { proxy } from "@/shared/lib/apiProxy";

export const GET = () => proxy((axios) => axios.get("/lists"));
