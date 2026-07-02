import Link from "next/link";

export default function ThanksPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f4ef] px-4 py-12 text-neutral-950">
      <section className="w-full max-w-xl border border-[#eadfd4] bg-white px-6 py-12 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase text-[#7E5E35]">
          Pedido guardado
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          Tu seleccion esta preparada
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-600">
          Envia el mensaje desde WhatsApp. El pedido tambien queda registrado
          para verlo desde el panel admin.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex h-11 items-center bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          Volver al catalogo
        </Link>
      </section>
    </main>
  );
}
