import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { createServerAxios } from "@/shared/lib/axios/server";
import PublicFormView from "@/features/forms/components/PublicFormView";
import type { PublicForm } from "@/features/forms/types";

type Props = { params: Promise<{ slug: string }> };

/** Public, no login: the proxy matcher does not cover /forms. Null for unknown or inactive forms. */
const getForm = cache(async (slug: string): Promise<PublicForm | null> => {
  try {
    const serverAxios = await createServerAxios();
    return await serverAxios.get<PublicForm>(`/public/forms/${encodeURIComponent(slug)}`);
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const form = await getForm((await params).slug);
  return form
    ? { title: form.title, description: form.description || `Fill out "${form.title}".`, robots: { index: false } }
    : { title: "Form not found", robots: { index: false } };
}

async function PublicFormPage({ params }: Props) {
  const form = await getForm((await params).slug);

  return (
    <main className="flex min-h-screen justify-center bg-neutral-100 px-4 py-10 sm:py-16 dark:bg-neutral-950">
      <div className="flex w-full max-w-xl flex-col items-center gap-6">
        {form ? (
          <PublicFormView form={form} />
        ) : (
          <section className="w-full overflow-hidden rounded-2xl bg-white text-center shadow-xl ring-1 ring-black/5 dark:bg-neutral-900">
            <div className="h-16 bg-linear-to-br from-indigo-600 via-violet-600 to-purple-700" />
            <div className="flex flex-col items-center gap-2 px-6 py-10">
              <p className="text-5xl font-extrabold text-violet-600">404</p>
              <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">This form is not available</h1>
              <p className="max-w-sm text-sm text-neutral-500">
                The link may be wrong, or the form was turned off by its owner. Ask them for a new link.
              </p>
            </div>
          </section>
        )}
        <p className="text-xs text-neutral-500">
          Powered by{" "}
          <Link href="/" className="font-semibold text-violet-600 hover:underline">
            Click Up
          </Link>{" "}
          Forms
        </p>
      </div>
    </main>
  );
}

export default PublicFormPage;
