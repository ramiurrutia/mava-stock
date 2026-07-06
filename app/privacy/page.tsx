import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politica de privacidad",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f6f5f2] px-4 py-10 text-neutral-950 sm:px-6">
      <article className="mx-auto max-w-3xl border border-neutral-200 bg-white px-5 py-8 shadow-sm sm:px-8">
        <p className="text-xs font-semibold uppercase text-[#7E5E35]">
          Mava Cuadros
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Politica de privacidad
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Ultima actualizacion: 6 de julio de 2026
        </p>

        <div className="mt-8 space-y-7 text-sm leading-7 text-neutral-700">
          <section>
            <h2 className="text-lg font-semibold text-neutral-950">
              Informacion que recopilamos
            </h2>
            <p className="mt-2">
              Cuando realizas un pedido o consulta en nuestro catalogo, podemos
              recopilar tu nombre, telefono, nombre de empresa o local,
              productos seleccionados, importes del pedido y observaciones que
              nos envies voluntariamente.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-950">
              Como usamos la informacion
            </h2>
            <p className="mt-2">
              Usamos estos datos para registrar pedidos, coordinar la
              preparacion de cuadros, responder consultas, informar el estado de
              un pedido y mantener una comunicacion comercial relacionada con tu
              solicitud.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-950">
              WhatsApp y notificaciones
            </h2>
            <p className="mt-2">
              Podemos usar WhatsApp Business para recibir consultas, enviar
              respuestas y notificar internamente al equipo de Mava Cuadros sobre
              nuevos pedidos. No publicamos tus datos personales ni los usamos
              para fines ajenos a la gestion del pedido.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-950">
              Almacenamiento y proveedores
            </h2>
            <p className="mt-2">
              La informacion del pedido puede almacenarse en servicios externos
              utilizados por la aplicacion, como bases de datos y almacenamiento
              en la nube. Estos servicios se usan para operar el catalogo,
              conservar pedidos y permitir la administracion interna.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-950">
              Conservacion de datos
            </h2>
            <p className="mt-2">
              Conservamos la informacion durante el tiempo necesario para
              gestionar pedidos, resolver consultas, mantener registros
              administrativos y cumplir obligaciones comerciales o legales.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-950">
              Tus derechos
            </h2>
            <p className="mt-2">
              Podes solicitar la consulta, correccion o eliminacion de tus datos
              personales contactandonos por los canales habituales de Mava
              Cuadros.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-950">
              Cambios en esta politica
            </h2>
            <p className="mt-2">
              Podemos actualizar esta politica para reflejar cambios en la
              aplicacion, nuestros procesos o requisitos legales. La version
              vigente estara disponible en esta pagina.
            </p>
          </section>
        </div>

        <Link
          href="/"
          className="mt-10 inline-flex h-11 items-center bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          Volver al catalogo
        </Link>
      </article>
    </main>
  );
}
