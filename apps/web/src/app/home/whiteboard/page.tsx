import { redirect } from "next/navigation";
import { createServerAxios } from "@/shared/lib/axios/server";

/** The old single-board route: opens the first board, or the whiteboards index. */
async function LegacyWhiteboardPage() {
  let firstId: string | undefined;
  try {
    const axios = await createServerAxios();
    const boards = await axios.get<{ id: string }[]>("/whiteboards");
    firstId = boards[0]?.id;
  } catch {
    firstId = undefined;
  }
  redirect(firstId ? `/home/whiteboards/${firstId}` : "/home/whiteboards");
}

export default LegacyWhiteboardPage;
