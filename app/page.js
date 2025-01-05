import Link from "next/link";
import ButtonSignin from "@/components/ButtonSignin";
import DeckList from "@/components/DeckList";

export default function Page() {
  return (
    <>
      <header className="p-4 flex justify-end max-w-7xl mx-auto">
        <ButtonSignin text="Login" />
      </header>
      <main>
        <section className="flex flex-col items-center justify-center text-center gap-12 px-8 py-12">
          <h1 className="text-3xl font-extrabold">Flashcards ⚡️</h1>
          <p className="text-lg opacity-80">
            Practica y aprende con nuestros mazos de flashcards
          </p>
        </section>
        
        <section className="max-w-7xl mx-auto px-8 pb-24">
          <h2 className="text-2xl font-bold mb-8">Mazos disponibles</h2>
          <DeckList isPublic={true} />
        </section>
      </main>
    </>
  );
}
