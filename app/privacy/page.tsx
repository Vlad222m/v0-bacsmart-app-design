export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#08080D] text-white p-6 max-w-3xl mx-auto">
      <div className="py-8">
        <a href="/" className="text-[#FF6B35] hover:underline text-sm">&larr; Înapoi la aplicație</a>

        <h1 className="text-3xl font-bold mt-6 mb-2" style={{ fontFamily: "var(--font-syne)" }}>
          Politică de Confidențialitate
        </h1>
        <p className="text-gray-400 text-sm mb-8">Ultima actualizare: 16 iunie 2026</p>

        <div className="space-y-6 text-gray-300 text-sm leading-relaxed">
          <Section title="1. Introducere">
            BACsmart ("aplicația") este o aplicație educațională destinată elevilor de liceu din România pentru pregătirea examenului de Bacalaureat.
            Această politică explică ce date colectăm și cum le folosim.
          </Section>

          <Section title="2. Date colectate">
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Cont</strong>: adresa de email și numele (opțional, la înregistrare)</li>
              <li><strong>Progres</strong>: scoruri la teste, răspunsuri, rezumate și quiz-uri create</li>
              <li><strong>Preferințe</strong>: profilul BAC selectat și materiile alese</li>
              <li><strong>Conversații AI</strong>: istoricul mesajelor cu asistentul AI (doar pentru a oferi context conversației)</li>
            </ul>
          </Section>

          <Section title="3. Date NU colectate">
            <p>BACsmart NU colectează:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Date de localizare</li>
              <li>Contacte telefonice</li>
              <li>Fotografii din galerie (doar cele selectate explicit de utilizator)</li>
              <li>Date biometrice</li>
              <li>Identificatori unici de dispozitiv (în afară de ID-ul de autentificare)</li>
            </ul>
          </Section>

          <Section title="4. Stocarea datelor">
            Datele sunt stocate pe serverele noastre prin intermediul serviciului Supabase, situat în UE.
            Backup local opțional în localStorage pe dispozitivul utilizatorului.
          </Section>

          <Section title="5. Date partajate cu terțe părți">
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>OpenRouter.ai</strong> — pentru procesarea mesajelor AI (textul conversațiilor, fără date personale)</li>
              <li><strong>RevenueCat</strong> — pentru gestionarea abonamentelor premium (doar ID-ul de utilizator și statusul abonamentului)</li>
              <li><strong>Vercel</strong> — hostingul aplicației</li>
            </ul>
            <p className="mt-2">Nu vindem date personale către terțe părți.</p>
          </Section>

          <Section title="6. Drepturile utilizatorului">
            Poți oricând:
            <ul className="list-disc pl-5 space-y-1">
              <li>Să îți ștergi contul și toate datele asociate (din Setări)</li>
              <li>Să îți ștergi istoricul conversațiilor</li>
              <li>Să resetezi tot progresul</li>
              <li>Să soliciți exportul datelor tale (trimite email la support@bacsmart.ro)</li>
            </ul>
          </Section>

          <Section title="7. Securitate">
            Folosim autentificare prin Supabase (securizată), token JWT pentru API requests
            și RLS (Row Level Security) pentru baza de date. Fiecare utilizator poate accesa doar propriile date.
          </Section>

          <Section title="8. Contact">
            <p>Pentru întrebări legate de confidențialitate:</p>
            <p>Email: <a href="mailto:support@bacsmart.ro" className="text-[#FF6B35] hover:underline">support@bacsmart.ro</a></p>
            <p>Website: <a href="https://v0-bacsmart-app-design.vercel.app" className="text-[#FF6B35] hover:underline">https://v0-bacsmart-app-design.vercel.app</a></p>
          </Section>

          <Section title="9. Modificări">
            Această politică poate fi actualizată periodic. Utilizatorii vor fi notificați prin aplicație în cazul unor modificări semnificative.
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-white text-lg font-semibold mb-2" style={{ fontFamily: "var(--font-syne)" }}>{title}</h2>
      <div>{children}</div>
    </div>
  );
}
