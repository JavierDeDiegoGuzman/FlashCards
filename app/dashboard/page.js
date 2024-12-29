import ButtonAccount from "@/components/ButtonAccount";
import DeckList from "@/components/DeckList";
import CreateDeckButton from "@/components/CreateDeckButton";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  return (
    <main className="min-h-screen p-8 pb-24">
      <section className="max-w-7xl mx-auto space-y-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <ButtonAccount />
          <h1 className="text-3xl md:text-4xl font-extrabold whitespace-nowrap">Mis Barajas</h1>
          <CreateDeckButton />
        </div>
        <DeckList />
      </section>
    </main>
  );
}
