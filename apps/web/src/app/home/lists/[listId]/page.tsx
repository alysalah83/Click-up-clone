import { redirect } from "next/navigation";

async function ListIdPage({ params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params;

  redirect(`/home/lists/${listId}/board`);
}

export default ListIdPage;
