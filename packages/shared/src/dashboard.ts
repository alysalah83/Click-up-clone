import { z } from "zod";
import { idSchema } from "./common.js";

export const dashboardBurndownQuerySchema = z.object({ listId: idSchema });
