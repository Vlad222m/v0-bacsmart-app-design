"use client";

import { useState } from "react";
import { ArrowLeft, Search, ChevronDown, Mail, Zap } from "lucide-react";

interface HelpScreenProps {
  onBack: () => void;
  showToastMessage: (msg: string) => void;
}

export default function HelpScreen({ onBack, showToastMessage }: HelpScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactSubject, setContactSubject] = useState("Raportare problema");
  const [contactMessage, setContactMessage] = useState("");

  const faqData = [
    {
      category: "📱 Cont și profil",
      items: [
        { q: "Cum îmi schimb parola?", a: "Mergi la Profil → Setări cont → Schimbă parola. Vei primi un email de confirmare." },
        { q: "Pot folosi același cont pe mai multe dispozitive?", a: "Da! Contul tău BACsmart funcționează pe orice dispozitiv. Progresul se sincronizează automat." },
        { q: "Cum îmi șterg contul?", a: "Mergi la Profil → Setări → Șterge contul. Atenție: această acțiune este ireversibilă." },
      ],
    },
    {
      category: "💳 Abonamente",
      items: [
        { q: "Cum anulez abonamentul?", a: "Poți anula oricând din setările Google Play sau App Store. Accesul Premium rămâne până la sfârșitul perioadei plătite." },
        { q: "Există perioadă de trial?", a: "Da! Primești 7 zile gratuite când te abonezi prima dată la Premium." },
        { q: "Ce metode de plată acceptați?", a: "Acceptăm toate metodele disponibile în Google Play și App Store: card bancar, Google Pay, Apple Pay." },
      ],
    },
    {
      category: "🤖 Profesor AI",
      items: [
        { q: "De câte ori pot folosi chat-ul AI?", a: "Planul gratuit include 5 mesaje pe zi. Premium oferă mesaje nelimitate." },
        { q: "AI-ul greșește uneori?", a: "Ca orice sistem AI, poate face ocazional greșeli. Recomandăm să verifici informațiile importante cu manualul." },
        { q: "La ce materii mă poate ajuta?", a: "BACsmart acoperă toate cele 7 materii de BAC: Matematică, Română, Istorie, Biologie, Fizică, Chimie, Informatică." },
      ],
    },
    {
      category: "📝 Teste și progres",
      items: [
        { q: "Cum sunt generate testele?", a: "Testele sunt generate aleatoriu din baza noastră de 100+ întrebări verificate, similare cu subiectele BAC oficiale." },
        { q: "Progresul meu se salvează?", a: "Da, progresul se salvează automat în contul tău și este sincronizat pe toate dispozitivele." },
        { q: "Pot relua un test?", a: "Da! Poți relua orice test de câte ori dorești. Întrebările sunt randomizate la fiecare sesiune." },
      ],
    },
  ];

  const filteredFaq = faqData
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.a.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((section) => section.items.length > 0);

  const handleSendMessage = () => {
    if (!contactMessage.trim()) return;
    setShowContactForm(false);
    setContactMessage("");
    showToastMessage("✅ Mesaj trimis! Răspundem în 24 ore");
  };

  return (
    <div className="fixed inset-0 bg-[#08080D] z-[150] animate-in slide-in-from-right duration-300">
      <div className="h-full flex flex-col p-4 max-w-md sm:max-w-lg mx-auto">
        {/* Header */}
        <button onClick={onBack} className="flex items-center gap-2 text-foreground mb-6 hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Inapoi</span>
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-4" style={{ fontFamily: "var(--font-syne)" }}>
          Ajutor
        </h1>

        {/* Search Bar */}
        <div className="mb-4 flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cauta intrebari..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-foreground text-sm focus:outline-none placeholder:text-muted-foreground"
          />
        </div>

        {/* FAQ Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {filteredFaq.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nu am gasit intrebari pentru cautarea ta</p>
          ) : (
            filteredFaq.map((section, sIdx) => (
              <div key={sIdx}>
                <h2 className="text-sm font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-syne)" }}>
                  {section.category}
                </h2>
                <div className="space-y-2">
                  {section.items.map((item, iIdx) => {
                    const faqId = `${sIdx}-${iIdx}`;
                    const isExpanded = expandedFaq === faqId;
                    return (
                      <button
                        key={faqId}
                        onClick={() => setExpandedFaq(isExpanded ? null : faqId)}
                        className="w-full text-left bg-card border border-border rounded-lg p-3 hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-foreground text-sm">{item.q}</p>
                          <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </div>
                        {isExpanded && <p className="text-xs text-muted-foreground mt-2">{item.a}</p>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Contact Section */}
        <div className="border-t border-border pt-4">
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">support@bacsmart.ro</span>
            </div>
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full inline-flex items-center gap-1">
              <Zap className="w-3 h-3" /> Timp de răspuns: 24 ore
            </span>
          </div>
          <button onClick={() => setShowContactForm(true)} className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
            Trimite un mesaj
          </button>
        </div>
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4">
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full border border-border max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-foreground mb-4" style={{ fontFamily: "var(--font-syne)" }}>Contacteaza-ne</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Subiect</label>
                <select
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option>Raportare problema</option>
                  <option>Sugestie de feature</option>
                  <option>Eroare in intrebari</option>
                  <option>Alte intrebari</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Mesajul tau</label>
                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Scrie mesajul tau aici..."
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none h-32"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowContactForm(false)} className="flex-1 py-2 rounded-lg font-medium bg-muted text-foreground hover:bg-muted/80 transition-colors">Anuleaza</button>
                <button
                  onClick={handleSendMessage}
                  disabled={!contactMessage.trim()}
                  className="flex-1 py-2 rounded-lg font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Trimite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
