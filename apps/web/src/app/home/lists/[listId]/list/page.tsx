import { Metadata } from "next";
import ListSlides from "@/features/task/views/List/ListSlides";

export const metadata: Metadata = {
  title: "List",
};

function page() {
  return (
    <main className="p-3 sm:p-4 lg:p-8">
      <ListSlides />
    </main>
  );
}

export default page;
