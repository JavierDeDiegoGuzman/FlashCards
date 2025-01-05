import ButtonAccount from "@/components/ButtonAccount";
import DeckList from "@/components/DeckList";
import CreateDeckButton from "@/components/CreateDeckButton";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  return (
    <main className="min-h-screen p-8 pb-24">
      <section className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl md:text-4xl font-extrabold">Mis Barajas</h1>
          <CreateDeckButton />
        </div>
        <DeckList isPublic={false} />
      </section>
    </main>
  );
}
