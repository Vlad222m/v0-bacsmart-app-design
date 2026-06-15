"use client";

import { Check } from "lucide-react";

interface PremiumTabProps {
  onPlanClick: (type: "free" | "monthly" | "annual") => void;
  currentPlan: string;
}

export default function PremiumTab({ onPlanClick, currentPlan }: PremiumTabProps) {
  const plans = [
    {
      id: "free" as const,
      name: "Gratuit",
      price: "0",
      period: "",
      features: ["5 mesaje/zi", "Teste limitate", "Progres de baza"],
      popular: false,
      buttonText: "Plan curent",
      active: currentPlan === "free",
    },
    {
      id: "monthly" as const,
      name: "Premium",
      price: "50",
      period: "/luna",
      features: ["Mesaje nelimitate", "Toate testele", "Progres detaliat", "Fara reclame", "Suport prioritar"],
      popular: true,
      buttonText: currentPlan === "premium" ? "Plan curent" : "Alege Premium",
      active: currentPlan === "premium",
    },
    {
      id: "annual" as const,
      name: "Anual",
      price: "35",
      period: "/luna",
      features: ["Tot ce include Premium", "Economisesti 30%", "Facturat anual (420 lei)"],
      popular: false,
      buttonText: currentPlan === "annual" ? "Plan curent" : "Cel mai avantajos",
      active: currentPlan === "annual",
    },
  ];

  return (
    <div className="space-y-5 pt-2">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-foreground mb-1" style={{ fontFamily: "var(--font-syne)" }}>
          Alege Planul Tau
        </h1>
        <p className="text-sm text-muted-foreground">Deblocheaza tot potentialul BACsmart</p>
      </div>

      {/* Plan Cards */}
      <div className="space-y-4">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative bg-card rounded-2xl p-4 border-2 ${plan.active ? "border-green-500" : plan.popular ? "border-primary" : "border-border"}`}
          >
            {plan.popular && !plan.active && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                CEL MAI POPULAR
              </div>
            )}
            {plan.active && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" /> ACTIV
              </div>
            )}

            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg text-foreground" style={{ fontFamily: "var(--font-syne)" }}>{plan.name}</h3>
              <div className="text-right">
                <span className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-syne)" }}>{plan.price}</span>
                <span className="text-sm text-muted-foreground"> lei{plan.period}</span>
              </div>
            </div>

            <ul className="space-y-2 mb-4">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className={`w-4 h-4 ${plan.active ? "text-green-500" : plan.popular ? "text-primary" : "text-secondary"}`} />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => onPlanClick(plan.id)}
              disabled={plan.active}
              className={`w-full py-3 rounded-xl font-medium transition-all ${
                plan.active
                  ? "bg-green-500/20 text-green-500 cursor-not-allowed"
                  : plan.popular
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "bg-muted text-foreground hover:bg-muted/80"
              }`}
            >
              {plan.buttonText}
            </button>
          </div>
        ))}
      </div>

      {/* Trust Badge */}
      <div className="text-center text-xs text-muted-foreground">
        <p>Plati securizate prin Stripe</p>
        <p className="mt-1">Anuleaza oricand, fara obligatii</p>
      </div>
    </div>
  );
}
