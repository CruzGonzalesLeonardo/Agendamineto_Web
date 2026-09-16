export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-950">
      <section className="mx-auto max-w-5xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Portal ciudadano</p>
        <h1 className="max-w-3xl text-5xl font-bold tracking-tight">Agenda tu atención con claridad y sin filas innecesarias.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">Encuentra el trámite adecuado, recibe orientación y reserva una cita en una agencia cercana.</p>
        <div className="mt-10 flex flex-wrap gap-4">
          <a className="rounded-full bg-teal-700 px-6 py-3 font-semibold text-white transition hover:bg-teal-800" href="/agendar">Comenzar agendamiento</a>
          <a className="rounded-full border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:border-teal-700 hover:text-teal-700" href="#orientacion">Ver cómo funciona</a>
        </div>
        <div id="orientacion" className="mt-20 grid gap-4 md:grid-cols-3">
          {[
            ["01", "Elige un trámite", "Te orientamos con información clara."],
            ["02", "Selecciona una agencia", "Compara ubicación y disponibilidad."],
            ["03", "Confirma tu cita", "Recibe la confirmación por correo o SMS."],
          ].map(([number, title, description]) => (
            <article key={number} className="border-t-2 border-teal-700 pt-5">
              <span className="text-sm font-bold text-teal-700">{number}</span>
              <h2 className="mt-3 text-xl font-bold">{title}</h2>
              <p className="mt-2 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
