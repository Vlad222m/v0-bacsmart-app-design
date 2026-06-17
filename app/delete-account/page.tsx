"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DeleteAccountPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!email) {
      setMessage("Te rog introdu adresa de email asociată contului.");
      return;
    }
    setLoading(true);
    setMessage("");

    // Try to find the user by email and delete their data
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("email", email);

    if (error) {
      setMessage("Eroare la ștergere. Te rugăm să ne contactezi la support@bacsmart.ro");
    } else {
      setMessage(
        "Am primit solicitarea. Contul și toate datele asociate vor fi șterse în maxim 48h. Vei primi o confirmare pe email."
      );
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#08080D] text-white p-6 max-w-2xl mx-auto">
      <div className="py-8">
        <a
          href="/"
          className="text-[#FF6B35] hover:underline text-sm"
        >
          &larr; Înapoi la aplicație
        </a>

        <h1
          className="text-3xl font-bold mt-6 mb-2"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          Ștergere cont
        </h1>
        <p className="text-gray-400 text-sm mb-8">
          Solicită ștergerea contului tău BACsmart și a tuturor datelor asociate.
        </p>

        <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Adresa de email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Introdu email-ul contului tău"
              className="w-full bg-[#08080D] border border-border rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#FF6B35]"
            />
          </div>

          <button
            onClick={handleDelete}
            disabled={loading}
            className="w-full py-3 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {loading ? "Se procesează..." : "Solicită ștergerea contului"}
          </button>

          {message && (
            <p className="text-sm text-gray-300 bg-gray-800/50 rounded-xl p-4">
              {message}
            </p>
          )}

          <div className="text-xs text-gray-500 space-y-2 pt-4 border-t border-border">
            <p>
              <strong>Ce date se șterg:</strong> profilul, scorurile, istoricul testelor,
              rezumatele, quiz-urile create și istoricul conversațiilor AI.
            </p>
            <p>
              <strong>Termen:</strong> Ștergerea completă se realizează în maxim 48h de la
              solicitare.
            </p>
            <p>
              Alternativ, poți trimite un email la{" "}
              <a
                href="mailto:support@bacsmart.ro"
                className="text-[#FF6B35] hover:underline"
              >
                support@bacsmart.ro
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
